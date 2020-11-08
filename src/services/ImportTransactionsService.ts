import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import {
  getCustomRepository,
  getRepository,
  In,
  TransactionRepository,
} from 'typeorm';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const csvFilePath = path.resolve(filePath);

    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value) return;

      categories.push(category);

      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const existenCategories = await categoriesRepository.find({
      where: { title: In(categories) },
    });

    const existentCategoriesTitles = existenCategories.map(
      (category: Category) => category.title,
    );

    const addCategoryTitles = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existenCategories];

    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionsRepository.save(createdTransactions);

    await fs.promises.unlink(filePath);

    return createdTransactions;

    // const lines: string[] = [];

    // parseCSV.on('data', line => {
    //   lines.push(line);
    // });

    // await new Promise(resolve => {
    //   parseCSV.on('end', resolve);
    // });

    // const transactionsRepository = getRepository(Transaction);
    // const categoryRepository = getRepository(Category);

    // const transactions: Transaction[] = [];

    // for (const ind in lines) {
    //   let verifyCategory = await categoryRepository.findOne({
    //     where: { title: lines[ind][3] },
    //   });

    //   if (!verifyCategory) {
    //     verifyCategory = categoryRepository.create({
    //       title: lines[ind][3],
    //     });

    //     await categoryRepository.save(verifyCategory);
    //   }

    //   const transactionData = {
    //     title: lines[ind][0],
    //     type: lines[ind][1] as 'income' | 'outcome',
    //     value: Number(lines[ind][2]),
    //     category_id: verifyCategory.id,
    //   };

    //   transactions.push(transactionsRepository.create(transactionData));

    //   transactions[ind].category = verifyCategory;

    //   await transactionsRepository.save(transactions[ind]);
    // }

    // await fs.promises.unlink(csvFilePath);

    // return transactions;
  }
}

export default ImportTransactionsService;
