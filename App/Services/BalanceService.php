<?php

namespace App\Services;


use \App\Models\Income;
use App\Models\IncomeCategory;
use \App\Models\PaymentMethod;
use App\Models\Expense;

class BalanceService
{
    public function getBalanceData(int $userId, ?int $month = null, ?string $startDate = null, ?string $endDate = null): array
    {
        if ($month !== null) {
            return $this->getMonthlyBalance($userId, $month);
        }

        if ($startDate && $endDate) {
            return $this->getCustomPeriodBalance($userId, $startDate, $endDate);
        }

        throw new \InvalidArgumentException('Either month or date range must be provided');
    }

    private function getMonthlyBalance(int $userId, int $month): array
    {
        $incomes = Income::getAllIncomes($userId, $month);
        $expenses = Expense::getAllExpenses($userId, $month);
        $sumIncomes = Income::getSumOfIncomes($userId, $month) ?? 0;
        $sumExpenses = Expense::getSumOfExpenses($userId, $month) ?? 0;

        return [
            'incomes' => $incomes,
            'expenses' => $expenses,
            'sumAllIncomes' => (float)$sumIncomes,
            'sumAllExpenses' => (float)$sumExpenses,
            'sum' => (float)$sumIncomes - (float)$sumExpenses,
            'incomeDetails' => Income::getAllDetailIncomes($userId, $month),
            'expenseDetails' => Expense::getAllDetailExpenses($userId, $month),
        ];
    }

    private function getCustomPeriodBalance(int $userId, string $startDate, string $endDate): array
    {
        $incomes = Income::getAllIncomesFromChoosenPeriod($userId, $startDate, $endDate);
        $expenses = Expense::getAllExpensesFromChoosenPeriod($userId, $startDate, $endDate);
        $sumIncomes = Income::getSumOfIncomesForChoosenPeriod($userId, $startDate, $endDate) ?? 0;
        $sumExpenses = Expense::getSumOfExpensesForChoosenPeriod($userId, $startDate, $endDate) ?? 0;

        return [
            'incomes' => $incomes,
            'expenses' => $expenses,
            'sumAllIncomes' => (float)$sumIncomes,
            'sumAllExpenses' => (float)$sumExpenses,
            'sum' => (float)$sumIncomes - (float)$sumExpenses,
            'incomeDetails' => Income::getAllDetailIncomesForChoosenPeriod($userId, $startDate, $endDate),
            'expenseDetails' => Expense::getAllDetailExpensesForChoosenPeriod($userId, $startDate, $endDate),
        ];
    }
}
