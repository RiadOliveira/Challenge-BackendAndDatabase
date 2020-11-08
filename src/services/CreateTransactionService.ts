import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;

  value: number;

  type: 'income' | 'outcome';

  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    const { total } = await transactionsRepository.getBalance();

    if (type === 'outcome' && total - value < 0) {
      throw new AppError('Outcome cant make total negative', 400);
    }

    let verifyCategory = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!verifyCategory) {
      verifyCategory = categoryRepository.create({
        title: category,
      });

      await categoryRepository.save(verifyCategory);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: verifyCategory.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
