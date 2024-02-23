import { type Book, type BookID, type BookNotID } from '../schema/book.schema'
import { ModelError } from '../error-handling/ModelError.type'
import { type QueryResult, Pool } from 'pg'

const config =
  process.env.NODE_ENV === 'test'
    ? {
        host: 'localhost',
        database: 'postgres',
        port: 5432,
        user: 'postgres',
        password: 'postgres',
      }
    : {
        host: process.env.DATABASE_HOST,
        database: process.env.DATABASE_NAME,
        port: 5432,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
      }

export const db = new Pool(config)
class BookModel {
  async getAll(): Promise<QueryResult<Book[]>> {
    return await db.query('SELECT * FROM books')
  }

  async getById({ id }: { id: BookID }): Promise<QueryResult<Book[]>> {
    return await db.query('SELECT * FROM books WHERE id = $1', [id])
  }

  async createBook({ input }: { input: BookNotID }): Promise<boolean> {
    const id: BookID = crypto.randomUUID()
    const { title, author, categories, link, year, imageURL } = input
    try {
      const query = `
      INSERT INTO books (id, title, author, categories, link, year, "imageURL")
      VALUES ($1, $2, $3, $4, $5, $6, $7)`
      const values = [id, title, author, categories, link, year, imageURL]
      await db.query(query, values)
      return true
    } catch (error) {
      throw new ModelError({ message: 'Can not created book', status: 400 })
    }
  }

  async updateBook({ id, input }: { id: BookID; input: BookNotID }): Promise<boolean> {
    const { title, author, categories, link, year, imageURL } = input
    try {
      const query = `
        UPDATE books
        SET title = $1, author = $2, categories = $3, link = $4, year = $5, "imageURL" = $6
        WHERE id = $7 
      `
      const values = [title, author, categories, link, year, imageURL, id]
      const result = await db.query(query, values)
      if (result.rowCount === 0) {
        throw new ModelError({ message: 'Book not found', status: 400 })
      } else {
        return true
      }
    } catch (error) {
      if (error instanceof ModelError) {
        throw error
      } else {
        throw new ModelError({ message: 'Can not found this book', status: 400 })
      }
    }
  }

  async delete({ id }: { id: BookID }): Promise<void> {
    await db.query('DELETE FROM books WHERE id = $1', [id])
  }
}

export const bookmodel = new BookModel()
