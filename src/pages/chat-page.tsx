import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, MessageSquare, Send, UserX } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'

import {
  fetchAdminGroups,
  fetchGroupMessages,
  fetchMyGroups,
  fetchProfile,
  removeGroupMember,
  sendGroupMessage,
} from '../lib/api'
import { useAuthStore } from '../lib/auth-store'
import { cn } from '../lib/utils'
import type { ChatGroupItem } from '../types/api'

export function ChatPage() {
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    enabled: Boolean(token),
    retry: false,
  })

  const isAdmin = profileQuery.data?.role === 'ADMIN'
  const myId = profileQuery.data?.id

  const groupsQuery = useQuery({
    queryKey: ['chat-groups', isAdmin ? 'admin' : 'mine'],
    queryFn: isAdmin ? fetchAdminGroups : fetchMyGroups,
    enabled: Boolean(token),
    refetchInterval: 8000,
  })

  const groups = groupsQuery.data ?? []
  const selectedGroup: ChatGroupItem | undefined =
    groups.find((group) => group.id === selectedGroupId) ?? groups[0]

  const groupsByProperty = useMemo(() => {
    const sections = new Map<number, { propertyId: number; propertyTitle: string; groups: ChatGroupItem[] }>()
    for (const group of groups) {
      const section = sections.get(group.propertyId) ?? {
        propertyId: group.propertyId,
        propertyTitle: group.propertyTitle,
        groups: [],
      }
      section.groups.push(group)
      sections.set(group.propertyId, section)
    }
    return [...sections.values()]
  }, [groups])

  const messagesQuery = useQuery({
    queryKey: ['chat-messages', selectedGroup?.id],
    queryFn: () => fetchGroupMessages(selectedGroup!.id),
    enabled: Boolean(token && selectedGroup != null),
    refetchInterval: 4000,
  })

  const messages = messagesQuery.data ?? []

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages.length, selectedGroup?.id])

  const sendMutation = useMutation({
    mutationFn: (content: string) => sendGroupMessage(selectedGroup!.id, content),
    onSuccess: () => {
      setDraft('')
      queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedGroup?.id] })
      queryClient.invalidateQueries({ queryKey: ['chat-groups'] })
    },
  })

  const removeMutation = useMutation({
    mutationFn: ({ groupId, userId }: { groupId: number; userId: number }) =>
      removeGroupMember(groupId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-groups'] })
      queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedGroup?.id] })
    },
  })

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    const content = draft.trim()
    if (!content || sendMutation.isPending) return
    sendMutation.mutate(content)
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  const otherMemberName = selectedGroup
    ? isAdmin
      ? null
      : selectedGroup.buyerId === myId
        ? selectedGroup.sellerName
        : selectedGroup.buyerName
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">
          {isAdmin ? 'Chat groups' : 'Messages'}
        </h1>
        <p className="mt-1 text-slate-400">
          {isAdmin
            ? 'All buyer–seller groups. You can read every conversation and remove members.'
            : 'Chat directly with the other party. The admin moderates the group.'}
        </p>
      </div>

      {groupsQuery.isLoading ? (
        <p className="text-sm text-slate-400">Loading conversations...</p>
      ) : groups.length === 0 ? (
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-10 text-center">
          <MessageSquare className="mx-auto size-10 text-amber-300/60" />
          <p className="mt-4 font-medium text-white">No chat groups yet</p>
          <p className="mt-1 text-sm text-slate-400">
            {isAdmin
              ? 'Groups appear here once sellers accept buyers into a group.'
              : 'Once a seller accepts you into a group, the conversation starts here.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-6">
            {groupsByProperty.map((section) => (
              <div key={section.propertyId}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-300/80">
                    {section.propertyTitle}
                  </p>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-400">
                    {section.groups.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {section.groups.map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setSelectedGroupId(group.id)}
                      className={cn(
                        'w-full rounded-2xl border px-4 py-3 text-left transition',
                        selectedGroup?.id === group.id
                          ? 'border-amber-400/40 bg-amber-400/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-white">
                          {isAdmin
                            ? `${group.buyerName ?? 'Buyer'} ↔ ${group.sellerName ?? 'Seller'}`
                            : `with ${group.buyerId === myId ? group.sellerName ?? 'Seller' : group.buyerName ?? 'Buyer'}`}
                        </p>
                        {group.lastMessageAt ? (
                          <span className="shrink-0 text-xs text-slate-500">
                            {new Date(group.lastMessageAt).toLocaleDateString()}
                          </span>
                        ) : null}
                      </div>
                      {group.lastMessage ? (
                        <p className="mt-1 truncate text-xs text-slate-500">{group.lastMessage}</p>
                      ) : (
                        <p className="mt-1 text-xs text-slate-600">No messages yet</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </aside>

          <section className="flex flex-col overflow-hidden rounded-[32px] border border-white/10 bg-white/5">
            <div className="border-b border-white/10 px-6 py-4">
              <p className="font-semibold text-white">
                {isAdmin
                  ? `${selectedGroup?.buyerName ?? 'Buyer'} ↔ ${selectedGroup?.sellerName ?? 'Seller'}`
                  : otherMemberName ?? 'Conversation'}
              </p>
              <Link
                to={`/properties/${selectedGroup?.propertyId}`}
                className="text-sm text-amber-300 hover:underline"
              >
                {selectedGroup?.propertyTitle}
              </Link>
            </div>

            <div
              ref={scrollRef}
              className="max-h-[420px] flex-1 space-y-3 overflow-y-auto px-6 py-4"
            >
              {messagesQuery.isLoading ? (
                <p className="text-sm text-slate-400">Loading messages...</p>
              ) : messages.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No messages yet. Say hello!
                </p>
              ) : (
                messages.map((message) => {
                  const mine = message.senderId === myId
                  return (
                    <div
                      key={message.id}
                      className={cn('flex', mine ? 'justify-end' : 'justify-start')}
                    >
                      <div
                        className={cn(
                          'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                          mine
                            ? 'rounded-br-md bg-amber-400 text-slate-950'
                            : 'rounded-bl-md bg-slate-800 text-slate-100',
                        )}
                      >
                        {!mine ? (
                          <p className="mb-0.5 text-xs font-medium text-slate-400">
                            {message.senderName ?? 'User'}
                          </p>
                        ) : null}
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p
                          className={cn(
                            'mt-1 text-right text-[10px]',
                            mine ? 'text-slate-800/70' : 'text-slate-500',
                          )}
                        >
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {isAdmin ? (
              <div className="border-t border-white/10 px-6 py-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                  Admin authority
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: selectedGroup?.buyerId, label: selectedGroup?.buyerName ?? 'Buyer' },
                    { id: selectedGroup?.sellerId, label: selectedGroup?.sellerName ?? 'Seller' },
                  ].map((member) =>
                    member.id != null ? (
                      <button
                        key={member.id}
                        type="button"
                        disabled={removeMutation.isPending}
                        onClick={() =>
                          removeMutation.mutate({
                            groupId: selectedGroup!.id,
                            userId: member.id!,
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20"
                      >
                        <UserX className="size-3.5" />
                        Remove {member.label}
                      </button>
                    ) : null,
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSend} className="flex items-center gap-3 border-t border-white/10 px-6 py-4">
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Type a message..."
                  maxLength={2000}
                  className="flex-1 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || sendMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:opacity-40"
                >
                  {sendMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  Send
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
