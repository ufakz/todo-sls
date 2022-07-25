import { TodosAccess } from '../dataLayer/todosAcess'
import { AttachmentUtils } from '../helpers/attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
// TODO: Implement businessLogic
const logger = createLogger('Todos')

const todosAccess = new TodosAccess()
const attachmentUtils = new AttachmentUtils()

export async function getTodos(userId: string): Promise<TodoItem[]> {
    logger.info(`Retrieving all todos for user ${userId}`)

    return await todosAccess.getAllTodos(userId)
}

export async function createTodo(userId: string, createTodoRequest: CreateTodoRequest): Promise<TodoItem> {
    const todoId = uuid.v4()

    const newItem: TodoItem = {
        userId,
        todoId,
        createdAt: new Date().toISOString(),
        done: false,
        attachmentUrl: null,
        ...createTodoRequest
    }

    logger.info(`Creating todo ${todoId} for user ${userId}`, { userId, todoId, todoItem: newItem })

    await todosAccess.createTodo(newItem)

    return newItem
}

export async function updateTodo(userId: string, todoId: string, updateTodoRequest: UpdateTodoRequest) {
    logger.info(`Updating todo ${todoId} for user ${userId}`, { userId, todoId, todoUpdate: updateTodoRequest })

    const item = await todosAccess.getTodo(todoId)

    if (!item)
        throw new Error('Item not found')  // FIXME: 404?

    if (item.userId !== userId) {
        logger.error(`User ${userId} does not have permission to update todo ${todoId}`)
        throw new Error('User is not authorized to update item')  // FIXME: 403?
    }

    todosAccess.updateTodo(todoId, updateTodoRequest as TodoUpdate)
}

export async function deleteTodo(userId: string, todoId: string) {
    logger.info(`Deleting todo ${todoId} for user ${userId}`, { userId, todoId })

    const item = await todosAccess.getTodo(todoId)

    if (!item)
        throw new Error('Item not found')

    if (item.userId !== userId) {
        logger.error(`User ${userId} does not have permission to delete todo ${todoId}`)
        throw new Error('User is not authorized to delete item')
    }

    todosAccess.deleteTodo(todoId)
}

export async function updateTodoAttachmentUrl(userId: string, todoId: string, attachmentId: string) {
    logger.info(`Generating attachment URL for attachment ${attachmentId}`)

    const attachmentUrl = await attachmentUtils.getAttachmentUrl(attachmentId)

    logger.info(`Updating todo ${todoId} with attachment URL ${attachmentUrl}`, { userId, todoId })

    const item = await todosAccess.getTodo(todoId)

    if (!item)
        throw new Error('Item not found')

    if (item.userId !== userId) {
        logger.error(`User ${userId} does not have permission to update todo ${todoId}`)
        throw new Error('User is not authorized to update item')
    }

    await todosAccess.setAttachmentUrl(todoId, attachmentUrl)
}

export async function createAttachmentPresignedUrl(attachmentId: string): Promise<string> {
    logger.info(`Generating upload URL for attachment ${attachmentId}`)

    const uploadUrl = await attachmentUtils.getUploadUrl(attachmentId)

    return uploadUrl
}