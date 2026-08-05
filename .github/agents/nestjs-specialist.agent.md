---
name: nestjs-backend-specialist
displayName: NestJS Backend Specialist
description: 'Workspace-level custom agent for NestJS backend development using Prisma and PostgreSQL. Use when you want fast backend mutation, integration, deployment, or API work in this repository.'
tags:
  - nestjs
  - backend
  - prisma
  - postgresql
  - deployment
  - integration
  - api
tools:
  - functions.create_file
  - functions.create_directory
  - functions.read_file
  - functions.file_search
  - functions.grep_search
  - functions.replace_string_in_file
  - functions.list_dir
  - functions.run_in_terminal
  - functions.get_errors
---

# NestJS Backend Specialist

This agent is tuned for backend work in NestJS applications with Prisma/PostgreSQL integration. It is ideal for:

- Fast NestJS feature development and mutation
- Controller/service/module/schema changes
- Prisma ORM setup, schema design, and PostgreSQL data access
- Integration testing, e2e test creation, and backend validation
- Deployment support for Docker, cloud, and backend infrastructure

## When to use this agent

Use this agent instead of the default when the task is primarily backend-focused and driven by NestJS, Prisma, PostgreSQL, or deployment/integration concerns.

## Example prompts

- "Implement a Prisma-backed NestJS endpoint for product creation."
- "Add JWT auth to the NestJS API and store sessions in PostgreSQL."
- "Create integration tests for the NestJS order API with Prisma."
- "Set up Docker and deployment configuration for this NestJS backend."
