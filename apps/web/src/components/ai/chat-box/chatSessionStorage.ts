import { persistedGetJson, persistedRemove, persistedSetJson } from '@/stores/persistence'

const ACTIVE_CONVERSATION_KEY = `ai_memory_context`
const CONVERSATION_LIST_KEY = `ai_conversation_list`

export interface ChatMessage {
  role: `user` | `assistant` | `system`
  content: string
  reasoning?: string
  done?: boolean
  id?: string
}

export interface ConversationSummary {
  id: string
  name: string
  timestamp: number
}

function conversationKey(id: string): string {
  return `ai_conversation_${id}`
}

export async function loadConversationList(): Promise<ConversationSummary[]> {
  return await persistedGetJson<ConversationSummary[]>(CONVERSATION_LIST_KEY) ?? []
}

export function saveConversationList(list: ConversationSummary[]): Promise<void> {
  return persistedSetJson(CONVERSATION_LIST_KEY, list)
}

export async function loadActiveConversation(): Promise<ChatMessage[]> {
  return await persistedGetJson<ChatMessage[]>(ACTIVE_CONVERSATION_KEY) ?? []
}

export function saveActiveConversation(messages: ChatMessage[]): Promise<void> {
  return persistedSetJson(ACTIVE_CONVERSATION_KEY, messages)
}

export async function loadConversationMessages(id: string): Promise<ChatMessage[]> {
  return await persistedGetJson<ChatMessage[]>(conversationKey(id)) ?? []
}

export function saveConversation(id: string, messages: ChatMessage[]): Promise<void> {
  return persistedSetJson(conversationKey(id), messages)
}

export function removeConversation(id: string): Promise<void> {
  return persistedRemove(conversationKey(id))
}
