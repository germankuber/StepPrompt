# Simulation Model Test Environment

This is a React application built with Vite and Supabase to manage simulation steps and prompts.

## Prerequisites

- Node.js (v16+)
- Supabase account (optional for local testing, required for persistence)

## Setup

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Configure Supabase:
    Create a `.env` file in the root directory (copy from `.env.example` if available, otherwise create new):

    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

    If you don't have Supabase credentials yet, the app will use local storage.

3.  Run the development server:
    ```bash
    npm run dev
    ```

## Database Schema (Supabase)

If using Supabase, create a table named `steps` with the following columns:

- `id` (uuid, primary key)
- `title` (text)
- `execution_prompt` (text)
- `execution_inject_user` (boolean)
- `validation_prompt` (text)
- `validation_inject_user` (boolean)
- `success_prompt` (text)
- `success_inject_user` (boolean)
- `order_index` (integer)
- `created_at` (timestamptz, default: now())

## Features

- List steps in order.
- Edit Execution, Validation, and Success Condition prompts.
- Toggle "Inject User Message" for each prompt.
- Save/Load configuration (Local Storage + Supabase).
