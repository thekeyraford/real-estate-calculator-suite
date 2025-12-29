import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Card from './ui/Card';
import Input from './ui/Input';
import { Toggle } from './ui/Toggle';
import Select from './ui/Select';
import Checkbox from './ui/Checkbox';
import Button from './ui/Button';
import { InputMode, LoanTerm, LoanType } from '../types';
import { formatCurrency, parseNumber } from '../utils/formatters';
import { BackIcon, ResetIcon, CopyIcon, SparkleIcon } from './icons';
import { getDownPaymentAnalysis } from '../services/geminiService';
import GeminiAnalysis from './GeminiAnalysis';

interface DownPaymentEstimatorProps {
  onBack: () => void;
}

const initialState = {
  homePrice: '',
  dpMode: InputMode.Percent,
  dpValue: '',
  loanType: LoanType.Conventional,
  ccMode: InputMode.Percent,
  ccValue: '',
  estimateMonthly: false,
  interestRate: '',
  loanTerm: LoanTerm.Thirty,
  taxMode: InputMode.Percent,
  taxValue: '',
  insurance: '',
  hoa: '',
};

const DownPaymentEstimator: React.FC<DownPaymentEstimatorProps> = ({ onBack }) => {
  const [inputs, setInputs] = useState(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copySuccess, setCopySuccess] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};

    // General non-negative check
    for (const key in inputs) {
        if (typeof (inputs as any)[key] === 'string') {
            if (parseNumber((inputs as any)[key] as string) < 0) {
                 newErrors[key] = "Value cannot be negative.";
            }
        }
    }

    // Specific validation for fields with modes
    if (inputs.dpMode === InputMode.Percent && parseNumber(inputs.dpValue) > 100) {
        newErrors.dpValue = "Percentage cannot exceed 100.";
    }
    if (inputs.ccMode === InputMode.Percent && parseNumber(inputs.ccValue) > 100) {
        newErrors.ccValue = "Percentage cannot exceed 100.";
    }
    if (inputs.taxMode === InputMode.Percent && parseNumber(inputs.taxValue) > 100) {
        newErrors.taxValue = "Percentage cannot exceed 100.";
    }

    // Specific validation for standalone percentage fields
    if (parseNumber(inputs.interestRate) > 100) {
        newErrors.interestRate = "Percentage cannot exceed 100.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [inputs]);

  useEffect(() => {
    validate();
  }, [inputs, validate]);

  const results = useMemo(() => {
    const homePrice = parseNumber(inputs.homePrice);
    const dpValue = parseNumber(inputs.dpValue);
    const ccValue = parseNumber(inputs.ccValue);

    const downPaymentAmount = inputs.dpMode === InputMode.Percent ? homePrice * (dpValue / 100) : dpValue;
    const loanAmount = homePrice - downPaymentAmount;
    const closingCosts = inputs.ccMode === InputMode.Percent ? homePrice * (ccValue / 100) : ccValue;
    const cashToClose = downPaymentAmount + closingCosts;

    let pAndI = 0, monthlyTaxes = 0, totalMonthly = 0;

    if (inputs.estimateMonthly) {
        const interestRate = parseNumber(inputs.interestRate);
        const insurance = parseNumber(inputs.insurance);
        const hoa = parseNumber(inputs.hoa);
        const taxValue = parseNumber(inputs.taxValue);

        const monthlyInterestRate = interestRate / 100 / 12;
        const numberOfPayments = inputs.loanTerm * 12;

        if (loanAmount > 0 && monthlyInterestRate > 0) {
             pAndI = loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
        }
       
        monthlyTaxes = inputs.taxMode === InputMode.Percent ? (homePrice * (taxValue / 100)) / 12 : taxValue / 12;
        totalMonthly = pAndI + monthlyTaxes + insurance + hoa;
    }

    return {
      downPaymentAmount,
      loanAmount,
      closingCosts,
      cashToClose,
      pAndI,
      monthlyTaxes,
      totalMonthly,
    };
  }, [inputs]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setInputs(prev => ({ ...prev, [name]: checked }));
    } else {
        setInputs(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLoanTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLoanType = e.target.value as LoanType;
    if (newLoanType === LoanType.FHA && inputs.dpValue === '') {
        setInputs(prev => ({ ...prev, loanType: newLoanType, dpMode: InputMode.Percent, dpValue: '3.5' }));
    } else {
        setInputs(prev => ({...prev, loanType: newLoanType}));
    }
  }

  const handleReset = () => {
    setInputs(initialState);
    setErrors({});
    setCopySuccess('');
    setAnalysis('');
    setIsAnalyzing(false);
  };
  
  const handleCopy = () => {
    const summary = `
Down Payment Estimator Summary:
Home Price: ${formatCurrency(parseNumber(inputs.homePrice))}
Down Payment: ${formatCurrency(results.downPaymentAmount)}
Loan Amount: ${formatCurrency(results.loanAmount)}
Closing Costs: ${formatCurrency(results.closingCosts)}
Cash to Close: ${formatCurrency(results.cashToClose)}
${inputs.estimateMonthly ? `
--- Monthly ---
P&I: ${formatCurrency(results.pAndI)}
Taxes: ${formatCurrency(results.monthlyTaxes)}
Insurance: ${formatCurrency(parseNumber(inputs.insurance))}
HOA: ${formatCurrency(parseNumber(inputs.hoa))}
Total Monthly: ${formatCurrency(results.totalMonthly)}` : ''}
    `.trim();

    navigator.clipboard.writeText(summary).then(() => {
        setCopySuccess('Copied to clipboard!');
        setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  const handleAnalyze = async () => {
    if (!validate()) return;
    setIsAnalyzing(true);
    setAnalysis('');
    const analysisData = {
        homePrice: formatCurrency(parseNumber(inputs.homePrice)),
        downPaymentAmount: formatCurrency(results.downPaymentAmount),
        downPaymentPercent: inputs.dpMode === InputMode.Percent ? inputs.dpValue : ((results.downPaymentAmount / parseNumber(inputs.homePrice)) * 100).toFixed(2),
        loanAmount: formatCurrency(results.loanAmount),
        loanType: inputs.loanType,
        closingCosts: formatCurrency(results.closingCosts),
        cashToClose: formatCurrency(results.cashToClose),
        totalMonthlyPayment: inputs.estimateMonthly ? formatCurrency(results.totalMonthly) : null,
        pAndI: inputs.estimateMonthly ? formatCurrency(results.pAndI) : null,
        monthlyTaxes: inputs.estimateMonthly ? formatCurrency(results.monthlyTaxes) : null,
        homeownersInsurance: inputs.estimateMonthly ? formatCurrency(parseNumber(inputs.insurance)) : null,
        hoa: inputs.estimateMonthly ? formatCurrency(parseNumber(inputs.hoa)) : null,
    };
    const result = await getDownPaymentAnalysis(analysisData);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Down Payment Estimator</h2>
        <Button onClick={onBack} variant="ghost" leftIcon={<BackIcon />}>Back</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Inputs */}
        <Card className="p-6 space-y-4">
          <Input label="Home Price" id="homePrice" name="homePrice" value={inputs.homePrice} onChange={handleChange} error={errors.homePrice} type="text" inputMode="decimal" leadingAddon="$"/>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Down Payment</label>
            <div className="grid grid-cols-2 gap-2">
              <Toggle value={inputs.dpMode} onChange={(v) => setInputs(p => ({...p, dpMode: v}))} options={[{value: InputMode.Percent, label: '%'}, {value: InputMode.Dollar, label: '$'}]} />
              <Input label="" id="dpValue" name="dpValue" value={inputs.dpValue} onChange={handleChange} error={errors.dpValue} type="text" inputMode="decimal" />
            </div>
          </div>

          <Select label="Loan Type" id="loanType" name="loanType" value={inputs.loanType} onChange={handleLoanTypeChange}>
            {Object.values(LoanType).map(t => <option key={t}>{t}</option>)}
          </Select>
          {inputs.loanType === LoanType.VA && <p className="text-xs text-blue-300">VA loans may not require a down payment for eligible veterans. Check with your lender.</p>}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Closing Costs</label>
            <div className="grid grid-cols-2 gap-2">
              <Toggle value={inputs.ccMode} onChange={(v) => setInputs(p => ({...p, ccMode: v}))} options={[{value: InputMode.Percent, label: '%'}, {value: InputMode.Dollar, label: '$'}]} />
              <Input label="" id="ccValue" name="ccValue" value={inputs.ccValue} onChange={handleChange} error={errors.ccValue} type="text" inputMode="decimal" />
            </div>
          </div>

          <div className="border-t border-white/20 pt-4">
             <Checkbox label="Estimate Monthly Payment" id="estimateMonthly" name="estimateMonthly" checked={inputs.estimateMonthly} onChange={handleChange} />
          </div>

          {inputs.estimateMonthly && (
            <div className="space-y-4 pt-4 border-t border-white/20">
                <Input label="Interest Rate (APR)" id="interestRate" name="interestRate" value={inputs.interestRate} onChange={handleChange} error={errors.interestRate} type="text" inputMode="decimal" leadingAddon="%"/>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Loan Term</label>
                    <Toggle value={String(inputs.loanTerm) as any} onChange={(v) => setInputs(p => ({...p, loanTerm: Number(v) as LoanTerm}))} options={[{value: String(LoanTerm.Thirty), label: '30 Year'}, {value: String(LoanTerm.Fifteen), label: '15 Year'}]} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Property Tax</label>
                    <div className="grid grid-cols-2 gap-2">
                    <Toggle value={inputs.taxMode} onChange={(v) => setInputs(p => ({...p, taxMode: v}))} options={[{value: InputMode.Percent, label: '% Price'}, {value: InputMode.Dollar, label: '$/Year'}]} />
                    <Input label="" id="taxValue" name="taxValue" value={inputs.taxValue} onChange={handleChange} error={errors.taxValue} type="text" inputMode="decimal" />
                    </div>
                </div>
                <Input label="Homeowners Insurance" id="insurance" name="insurance" value={inputs.insurance} onChange={handleChange} error={errors.insurance} type="text" inputMode="decimal" leadingAddon="$" trailingAddon="/Month"/>
                <Input label="HOA Dues" id="hoa" name="hoa" value={inputs.hoa} onChange={handleChange} error={errors.hoa} type="text" inputMode="decimal" leadingAddon="$" trailingAddon="/Month"/>
            </div>
          )}
        </Card>

        {/* Outputs */}
        <Card className="p-6 space-y-4 h-fit">
          <h3 className="text-xl font-bold border-b border-white/20 pb-2">Estimated Costs</h3>
          <div className="space-y-2 text-lg">
            <div className="flex justify-between"><span>Down Payment:</span> <strong>{formatCurrency(results.downPaymentAmount)}</strong></div>
            <div className="flex justify-between"><span>Loan Amount:</span> <strong>{formatCurrency(results.loanAmount)}</strong></div>
            <div className="flex justify-between"><span>Closing Costs:</span> <strong>{formatCurrency(results.closingCosts)}</strong></div>
            <div className="flex justify-between text-2xl font-bold pt-2 border-t border-white/20 text-blue-300"><span>Cash to Close:</span> <span>{formatCurrency(results.cashToClose)}</span></div>
          </div>

          {inputs.estimateMonthly && (
            <div className="pt-4 border-t border-white/20">
                 <h3 className="text-xl font-bold border-b border-white/20 pb-2 mb-2">Estimated Monthly Payment</h3>
                 <div className="space-y-2 text-lg">
                    <div className="flex justify-between"><span>Principal & Interest:</span> <strong>{formatCurrency(results.pAndI)}</strong></div>
                    <div className="flex justify-between"><span>Taxes:</span> <strong>{formatCurrency(results.monthlyTaxes)}</strong></div>
                    <div className="flex justify-between"><span>Insurance:</span> <strong>{formatCurrency(parseNumber(inputs.insurance))}</strong></div>
                    <div className="flex justify-between"><span>HOA:</span> <strong>{formatCurrency(parseNumber(inputs.hoa))}</strong></div>
                    <div className="flex justify-between text-2xl font-bold pt-2 border-t border-white/20 text-blue-300"><span>Total Monthly:</span> <span>{formatCurrency(results.totalMonthly)}</span></div>
                 </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-white/20">
              <Button onClick={handleReset} variant="secondary" leftIcon={<ResetIcon />}>Reset</Button>
              <Button onClick={handleCopy} variant="secondary" leftIcon={<CopyIcon />}>{copySuccess || 'Copy Summary'}</Button>
              <Button onClick={handleAnalyze} disabled={isAnalyzing || Object.keys(errors).length > 0} leftIcon={<SparkleIcon />}>Analyze with Gemini</Button>
          </div>
        </Card>
      </div>
      <GeminiAnalysis isLoading={isAnalyzing} analysis={analysis} title="Gemini Purchase Analysis" />
    </div>
  );
};

export default DownPaymentEstimator;