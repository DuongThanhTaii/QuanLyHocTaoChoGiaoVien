# Antigravity - AI Development Skills

## Skill: Generate Domain Entity
- Input: Entity name, attributes, business rules
- Output: TypeScript class with validation, domain events
- Rules: Must extend Entity/AggregateRoot, use Value Objects, immutable where possible

## Skill: Generate Repository
- Input: Entity name, queries needed
- Output: Interface (port) + Supabase implementation (adapter)
- Rules: Interface in application/ports, implementation in infrastructure/

## Skill: Generate Server Action
- Input: Use case description, required auth role
- Output: 'use server' function with Zod validation, error handling
- Rules: Must call use case, never direct DB access

## Skill: Generate UI Component
- Input: Screen name, actor (teacher/student/parent/admin), data requirements
- Output: Next.js page + components with loading/error states
- Rules: Server Component default, Client Component only for interactivity

## Skill: Generate Database Migration
- Input: Table name, fields, relationships, RLS requirements
- Output: SQL migration file + TypeScript types
- Rules: UUID primary keys, foreign key constraints, RLS policies, indexes

## Skill: Generate Payment Integration
- Input: Gateway name (vnpay/momo/zalopay)
- Output: Adapter class + webhook handler + env config
- Rules: Must implement IPaymentGateway, verify signatures, idempotent

## Skill: Generate Realtime Subscription
- Input: Table name, filter conditions, UI update logic
- Output: React hook using Supabase realtime
- Rules: Cleanup on unmount, handle reconnection, optimistic updates