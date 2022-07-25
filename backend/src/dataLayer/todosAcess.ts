import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')


export class TodosAccess {

    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly todosTable = process.env.TODOS_TABLE,
        private readonly todoIndex = process.env.TODOS_CREATED_AT_INDEX,
    ) { }


    // DynamoDB todo data access

    async todoExists(todoId: string): Promise<boolean> {
        const item = await this.getTodo(todoId)
        return !!item
    }

    async getAllTodos(userId: string): Promise<TodoItem[]> {
        logger.info(`Getting all todos for user ${userId}`)

        const result = await this.docClient.query({
            TableName: this.todosTable,
            IndexName: this.todoIndex,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise()

        const todos = result.Items
        return todos as TodoItem[]
    }

    async createTodo(todo: TodoItem) {
        logger.info(`Creating todo ${todo.todoId} for user ${todo.userId}`)

        await this.docClient.put({
            TableName: this.todosTable,
            Item: todo
        }).promise()

    }

    async getTodo(todoId: string): Promise<TodoItem> {
        logger.info(`Getting todo ${todoId}`)

        const result = await this.docClient.get({
            TableName: this.todosTable,
            Key: {
                todoId
            }
        }
        ).promise()

        const todo = result.Item
        return todo as TodoItem
    }

    async updateTodo(todoId: string, todoUpdate: TodoUpdate) {
        logger.info(`Updating todo ${todoId}`)

        await this.docClient.update({
            TableName: this.todosTable,
            Key: {
                todoId
            },
            UpdateExpression: 'set name = :name, dueDate = :dueDate, done = :done',
            ExpressionAttributeValues: {
                ":name": todoUpdate.name,
                ":dueDate": todoUpdate.dueDate,
                ":done": todoUpdate.done
            }
        }).promise()
    }

    async deleteTodo(todoId: string) {
        logger.info(`Deleting todo ${todoId}`)

        await this.docClient.delete({
            TableName: this.todosTable,
            Key: {
                todoId
            }
        }).promise()
    }

    async setAttachmentUrl(todoId: string, attachmentUrl: string) {
        logger.info(`Set attachment URL for todo ${todoId}`)

        await this.docClient.update({
            TableName: this.todosTable,
            Key: {
                todoId
            },
            UpdateExpression: 'set attachmentUrl = :attachmentUrl',
            ExpressionAttributeValues: {
                ':attachmentUrl': attachmentUrl
            }
        }).promise()
    }

}