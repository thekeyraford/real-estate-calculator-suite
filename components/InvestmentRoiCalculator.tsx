import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Card from './ui/Card';
import Input from './ui/Input';
import { Toggle } from './ui/Toggle';
import Button from './ui/Button';
import Accordion from './ui/Accordion';
import { InputMode, LoanTerm } from '../types';
import { formatCurrency, formatPercent, parseNumber } from '../utils/formatters';
import { BackIcon, ResetIcon, CopyIcon, SparkleIcon } from './icons';
import { getRoiAnalysis } from '../services/geminiService';
import GeminiAnalysis from './GeminiAnalysis';

interface InvestmentRoiCalculatorProps {
  onBack: () => void;
}

const initialState = {
  purchasePrice: '',
  propertyAddress: '',
  downPaymentPercent: '',
  interestRate: '',
  loanTerm: LoanTerm.Thirty,
  ccMode: InputMode.Percent,
  ccValue: '',
  rehab: '',
  monthlyRent: '',
  otherIncome: '',
  vacancyRate: '',
  propMgmt: '',
  repairsMaintenance: '',
  capex: '',
  taxMode: InputMode.Percent,
  taxValue: '',
  insurance: '',
  hoa: '',
  utilities: '',
};


const InvestmentRoiCalculator: React.FC<InvestmentRoiCalculatorProps> = ({ onBack }) => {
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
        
        // Percent fields that are always percentages
        const percentFields = ['downPaymentPercent', 'interestRate', 'vacancyRate', 'propMgmt', 'capex'];
        percentFields.forEach(key => {
            if (parseNumber((inputs as any)[key]) > 100) {
                newErrors[key] = "Percentage cannot exceed 100.";
            }
        });
        
        // Mode-dependent fields
        if (inputs.ccMode === InputMode.Percent && parseNumber(inputs.ccValue) > 100) {
            newErrors.ccValue = "Percentage cannot exceed 100.";
        }
        if (inputs.taxMode === InputMode.Percent && parseNumber(inputs.taxValue) > 100) {
            newErrors.taxValue = "Percentage cannot exceed 100.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [inputs]);

    useEffect(() => {
        validate();
    }, [inputs, validate]);

    const purchasePrice = parseNumber(inputs.purchasePrice);

    // Calculations for Asset Performance Test and syncing
    const assetCalculations = useMemo(() => {
        const grossRent = parseNumber(inputs.monthlyRent);
        
        // Monthly tax calculation
        const annualTaxes = inputs.taxMode === InputMode.Percent ? purchasePrice * (parseNumber(inputs.taxValue) / 100) : parseNumber(inputs.taxValue);
        const monthlyTaxes = annualTaxes / 12;

        // Monthly insurance calculation
        const monthlyInsurance = parseNumber(inputs.insurance) / 12;

        // Monthly PM fee calculation
        const propMgmtFee = grossRent * (parseNumber(inputs.propMgmt) / 100);

        return { monthlyTaxes, monthlyInsurance, propMgmtFee };
    }, [inputs.taxMode, inputs.taxValue, inputs.insurance, inputs.propMgmt, inputs.monthlyRent, purchasePrice]);

    const assetTestResults = useMemo(() => {
        const grossRent = parseNumber(inputs.monthlyRent);
        const repairs = parseNumber(inputs.repairsMaintenance);
        const hoa = parseNumber(inputs.hoa);

        const totalIncome = grossRent;
        const totalExpenses = repairs + assetCalculations.monthlyTaxes + assetCalculations.monthlyInsurance + assetCalculations.propMgmtFee + hoa;
        const noi = totalIncome - totalExpenses;
        const capRate = purchasePrice > 0 ? ((noi * 12) / purchasePrice) * 100 : 0;
        
        return { totalIncome, totalExpenses, noi, capRate };
    }, [inputs.monthlyRent, inputs.repairsMaintenance, inputs.hoa, assetCalculations, purchasePrice]);
    
    // Main ROI calculations
    const results = useMemo(() => {
        const p = {
            purchasePrice: purchasePrice,
            downPaymentPercent: parseNumber(inputs.downPaymentPercent),
            interestRate: parseNumber(inputs.interestRate),
            ccValue: parseNumber(inputs.ccValue),
            rehab: parseNumber(inputs.rehab),
            monthlyRent: parseNumber(inputs.monthlyRent),
            otherIncome: parseNumber(inputs.otherIncome),
            vacancyRate: parseNumber(inputs.vacancyRate),
            capex: parseNumber(inputs.capex),
            utilities: parseNumber(inputs.utilities),
        };
        
        const downPaymentAmount = p.purchasePrice * (p.downPaymentPercent / 100);
        const loanAmount = p.purchasePrice - downPaymentAmount;
        const closingCosts = inputs.ccMode === InputMode.Percent ? p.purchasePrice * (p.ccValue / 100) : p.ccValue;
        const totalCashInvested = downPaymentAmount + closingCosts + p.rehab;

        const monthlyInterestRate = p.interestRate / 100 / 12;
        const numberOfPayments = inputs.loanTerm * 12;
        let mortgagePayment = 0;
        if (loanAmount > 0 && monthlyInterestRate > 0) {
             mortgagePayment = loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
        }

        const grossMonthlyIncome = p.monthlyRent + p.otherIncome;
        const vacancyLoss = grossMonthlyIncome * (p.vacancyRate / 100);
        const effectiveIncome = grossMonthlyIncome - vacancyLoss;
        
        const capexReserve = grossMonthlyIncome * (p.capex / 100);

        // Use asset test expenses and add remaining ones
        const operatingExpenses = assetTestResults.totalExpenses + capexReserve + p.utilities;
        const noiMonthly = effectiveIncome - operatingExpenses;
        const noiAnnual = noiMonthly * 12;
        const cashFlowMonthly = noiMonthly - mortgagePayment;
        const cashFlowAnnual = cashFlowMonthly * 12;
        
        const cashOnCashReturn = totalCashInvested > 0 ? (cashFlowAnnual / totalCashInvested) * 100 : 0;
        const capRate = p.purchasePrice > 0 ? (noiAnnual / p.purchasePrice) * 100 : 0;
        
        return {
            loanAmount, mortgagePayment, totalCashInvested, grossMonthlyIncome, vacancyLoss, effectiveIncome, operatingExpenses, noiMonthly, noiAnnual, cashFlowMonthly, cashFlowAnnual, cashOnCashReturn, capRate
        };
    }, [inputs, purchasePrice, assetTestResults]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setInputs(prev => ({...prev, [name]: value}));
    };
    
    // Handlers to sync Asset Test inputs with main state
    const handleAssetChange = (field: string, value: string, isMonthlyToAnnual: boolean = false) => {
        const numericValue = parseNumber(value);
        const finalValue = isMonthlyToAnnual ? numericValue * 12 : numericValue;
        
        setInputs(prev => ({
            ...prev,
            [field]: finalValue.toString(),
            ...(field === 'taxValue' && { taxMode: InputMode.Dollar }),
        }));
    };

    const handlePropMgmtAssetChange = (value: string) => {
        const monthlyFee = parseNumber(value);
        const grossRent = parseNumber(inputs.monthlyRent);
        const newPercentage = grossRent > 0 ? (monthlyFee / grossRent) * 100 : 0;
        setInputs(prev => ({ ...prev, propMgmt: newPercentage.toString() }));
    };

    const handleReset = () => {
        setInputs(initialState);
        setErrors({});
        setCopySuccess('');
        setAnalysis('');
        setIsAnalyzing(false);
    };

    const handleCopy = () => {
        const summary = `
Investment ROI Summary for ${inputs.propertyAddress || 'property'}:
Purchase Price: ${formatCurrency(purchasePrice)}
Total Cash Invested: ${formatCurrency(results.totalCashInvested)}
---
Monthly Cash Flow: ${formatCurrency(results.cashFlowMonthly)}
Annual Cash Flow: ${formatCurrency(results.cashFlowAnnual)}
---
Cash on Cash Return: ${formatPercent(results.cashOnCashReturn)}
Cap Rate: ${formatPercent(results.capRate)}
        `.trim();
        navigator.clipboard.writeText(summary).then(() => {
            setCopySuccess('Copied!');
            setTimeout(() => setCopySuccess(''), 2000);
        });
    };
    
    const handleAnalyze = async () => {
        if (!validate()) return;
        setIsAnalyzing(true);
        setAnalysis('');
        const analysisData = {
            purchasePrice: formatCurrency(purchasePrice),
            totalCashInvested: formatCurrency(results.totalCashInvested),
            loanAmount: formatCurrency(results.loanAmount),
            grossMonthlyIncome: formatCurrency(results.grossMonthlyIncome),
            operatingExpenses: formatCurrency(results.operatingExpenses),
            noiMonthly: formatCurrency(results.noiMonthly),
            cashFlowMonthly: formatCurrency(results.cashFlowMonthly),
            cashFlowAnnual: formatCurrency(results.cashFlowAnnual),
            cashOnCashReturn: results.cashOnCashReturn.toFixed(2),
            capRate: results.capRate.toFixed(2),
        };
        const result = await getRoiAnalysis(analysisData);
        setAnalysis(result);
        setIsAnalyzing(false);
    };

    const renderSection = (title: string, children: React.ReactNode) => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b border-white/20 pb-2">{title}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {children}
            </div>
        </div>
    );
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">Investment ROI Calculator</h2>
                <Button onClick={onBack} variant="ghost" leftIcon={<BackIcon />}>Back</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6">
                        {renderSection("Purchase & Financing", <>
                            <Input label="Purchase Price" name="purchasePrice" value={inputs.purchasePrice} onChange={handleChange} error={errors.purchasePrice} type="number" leadingAddon="$" />
                            <Input label="Down Payment" name="downPaymentPercent" value={inputs.downPaymentPercent} onChange={handleChange} error={errors.downPaymentPercent} type="number" leadingAddon="%" />
                            <Input label="Interest Rate (APR)" name="interestRate" value={inputs.interestRate} onChange={handleChange} error={errors.interestRate} type="number" leadingAddon="%" />
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Loan Term</label>
                                <Toggle value={String(inputs.loanTerm) as any} onChange={(v) => setInputs(p => ({...p, loanTerm: Number(v) as LoanTerm}))} options={[{value: String(LoanTerm.Thirty), label: '30 Year'}, {value: String(LoanTerm.Fifteen), label: '15 Year'}]} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Closing Costs</label>
                                <div className="grid grid-cols-2 gap-2">
                                <Toggle value={inputs.ccMode} onChange={(v) => setInputs(p => ({...p, ccMode: v}))} options={[{value: InputMode.Percent, label: '%'}, {value: InputMode.Dollar, label: '$'}]} />
                                <Input label="" name="ccValue" value={inputs.ccValue} onChange={handleChange} error={errors.ccValue} type="number" />
                                </div>
                            </div>
                            <Input label="Rehab / Initial Repairs" name="rehab" value={inputs.rehab} onChange={handleChange} error={errors.rehab} type="number" leadingAddon="$" />
                        </>)}
                    </Card>

                    <Accordion title="Asset Performance Test">
                       <div className="space-y-4">
                          <Input label="Property Address (Optional)" name="propertyAddress" value={inputs.propertyAddress} onChange={handleChange} />
                          
                          <div>
                            <h4 className="text-md font-semibold text-gray-300 mb-2">Monthly Income</h4>
                            <Input label="Gross Rent" name="monthlyRent" value={inputs.monthlyRent} onChange={handleChange} error={errors.monthlyRent} type="number" leadingAddon="$" />
                          </div>
                          
                          <div>
                            <h4 className="text-md font-semibold text-gray-300 mb-2">Monthly Expenses</h4>
                            <div className="space-y-3">
                               <div>
                                  <Input label="Repairs & Maintenance" name="repairsMaintenance" value={inputs.repairsMaintenance} onChange={handleChange} error={errors.repairsMaintenance} type="number" leadingAddon="$" />
                                  <p className="mt-1 text-xs text-gray-400">Actual or estimate (e.g., 1% of home value annually, divided by 12)</p>
                               </div>
                               <div>
                                  <Input label="Property Taxes" value={assetCalculations.monthlyTaxes.toFixed(2)} onChange={e => handleAssetChange('taxValue', e.target.value, true)} type="number" leadingAddon="$" />
                                  <p className="mt-1 text-xs text-gray-400">Actual or estimate = FMV × 0.004</p>
                               </div>
                               <div>
                                  {/* FIX: Corrected the function call from 'handleAsset' to 'handleAssetChange' and completed it. */}
                                  <Input label="Insurance" value={assetCalculations.monthlyInsurance.toFixed(2)} onChange={e => handleAssetChange('insurance', e.target.value, true)} type="number" leadingAddon="$" />
                                  <p className="mt-1 text-xs text-gray-400">Actual or estimate</p>
                               </div>
                               <div>
                                  <Input label="Property Management" value={assetCalculations.propMgmtFee.toFixed(2)} onChange={e => handlePropMgmtAssetChange(e.target.value)} type="number" leadingAddon="$" />
                                  <p className="mt-1 text-xs text-gray-400">Based on % of Gross Rent</p>
                               </div>
                               <Input label="HOA" name="hoa" value={inputs.hoa} onChange={handleChange} error={errors.hoa} type="number" leadingAddon="$" />
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-white/20">
                            <h4 className="text-md font-semibold text-gray-300 mb-2">Performance Metrics</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between"><span>Monthly NOI:</span> <strong>{formatCurrency(assetTestResults.noi)}</strong></div>
                              <div className="flex justify-between"><span>Cap Rate:</span> <strong>{formatPercent(assetTestResults.capRate)}</strong></div>
                            </div>
                          </div>
                       </div>
                    </Accordion>
                    
                    <Card className="p-6">
                        {renderSection("Income", <>
                            <Input label="Other Monthly Income" name="otherIncome" value={inputs.otherIncome} onChange={handleChange} error={errors.otherIncome} type="number" leadingAddon="$" />
                        </>)}
                    </Card>

                     <Card className="p-6">
                        {renderSection("Operating Expenses", <>
                            <Input label="Vacancy Rate" name="vacancyRate" value={inputs.vacancyRate} onChange={handleChange} error={errors.vacancyRate} type="number" leadingAddon="%" />
                            <Input label="Property Management" name="propMgmt" value={inputs.propMgmt} onChange={handleChange} error={errors.propMgmt} type="number" leadingAddon="%" />
                            <Input label="CapEx / Reserves" name="capex" value={inputs.capex} onChange={handleChange} error={errors.capex} type="number" leadingAddon="%" />
                            <Input label="Utilities" name="utilities" value={inputs.utilities} onChange={handleChange} error={errors.utilities} type="number" leadingAddon="$" trailingAddon="/Month"/>
                        </>)}
                    </Card>
                </div>

                {/* Outputs */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-6 space-y-4 h-fit sticky top-24">
                        <h3 className="text-xl font-bold border-b border-white/20 pb-2">Key Return Metrics</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-lg">Cash on Cash Return:</span>
                                <strong className="text-3xl font-bold text-blue-300">{formatPercent(results.cashOnCashReturn)}</strong>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="text-lg">Cap Rate:</span>
                                <strong className="text-3xl font-bold text-blue-300">{formatPercent(results.capRate)}</strong>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-white/20">
                                <span className="text-lg">Monthly Cash Flow:</span>
                                <strong className="text-2xl font-bold text-green-400">{formatCurrency(results.cashFlowMonthly)}</strong>
                            </div>
                        </div>

                        <Accordion title="View Detailed Breakdown" startOpen={false}>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span>Total Cash Invested:</span> <strong>{formatCurrency(results.totalCashInvested)}</strong></div>
                                <hr className="border-white/10 my-1"/>
                                <div className="flex justify-between"><span>Effective Monthly Income:</span> <strong>{formatCurrency(results.effectiveIncome)}</strong></div>
                                <div className="flex justify-between"><span>- Total OpEx:</span> <strong>{formatCurrency(results.operatingExpenses)}</strong></div>
                                <div className="flex justify-between font-semibold"><span>= Monthly NOI:</span> <strong>{formatCurrency(results.noiMonthly)}</strong></div>
                                <hr className="border-white/10 my-1"/>
                                <div className="flex justify-between"><span>- Mortgage:</span> <strong>{formatCurrency(results.mortgagePayment)}</strong></div>
                                <div className="flex justify-between font-semibold"><span>= Monthly Cash Flow:</span> <strong>{formatCurrency(results.cashFlowMonthly)}</strong></div>
                                <hr className="border-white/10 my-1"/>
                                <div className="flex justify-between"><span>Annual Cash Flow:</span> <strong>{formatCurrency(results.cashFlowAnnual)}</strong></div>
                            </div>
                        </Accordion>
                        
                        <div className="flex flex-wrap gap-2 pt-4 border-t border-white/20">
                            <Button onClick={handleReset} variant="secondary" leftIcon={<ResetIcon />}>Reset</Button>
                            <Button onClick={handleCopy} variant="secondary" leftIcon={<CopyIcon />}>{copySuccess || 'Copy'}</Button>
                            <Button onClick={handleAnalyze} disabled={isAnalyzing || Object.keys(errors).length > 0} leftIcon={<SparkleIcon />}>Analyze</Button>
                        </div>
                    </Card>
                </div>
            </div>
            <GeminiAnalysis isLoading={isAnalyzing} analysis={analysis} title="Gemini Investment Analysis" />
        </div>
    );
};

// FIX: Added default export to resolve module import error.
export default InvestmentRoiCalculator;