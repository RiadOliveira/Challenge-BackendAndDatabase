import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const balance: Balance = {
      income: 0,
      outcome: 0,
      total: 0,
    };

    const incomeTransactions = await this.find({ where: { type: 'income' } });
    if (incomeTransactions.length !== 0) {
      const incomeValues = incomeTransactions.map(transaction => {
        return Number(transaction.value);
      });
      balance.income = incomeValues.reduce((prev, next) => prev + next);
    }

    const outcomeTransactions = await this.find({ where: { type: 'outcome' } });

    if (outcomeTransactions.length !== 0) {
      const outcomeValues = outcomeTransactions.map(transaction => {
        return Number(transaction.value);
      });

      balance.outcome = outcomeValues.reduce((prev, next) => prev + next);
    }

    balance.total = balance.income - balance.outcome;

    return balance;
  }
}

export default TransactionsRepository;
