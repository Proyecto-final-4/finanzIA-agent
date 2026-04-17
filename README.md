# finanzIA Agent

Agente de IA para el asistente financiero personal **finanzIA**, construido con LangGraph y LangChain.

## ¿Qué hace?

Procesa mensajes del usuario y ejecuta herramientas para gestionar transacciones e ingresos/gastos personales contra un backend Java.

**Herramientas disponibles:**
- `get_categories` / `create_category` / `update_category` / `delete_category`
- `get_transactions` / `create_transaction` / `get_transaction_detail`

## Variables de entorno

Copia `.env.example` a `.env` y completa los valores:

```bash
cp .env.example .env
```

Ver `.env.example` para la descripción de cada variable.

## Correr localmente

```bash
npm install
npm run dev
```

El servidor levanta en `http://localhost:2024`.

## Lint y formato

```bash
npm run format   # formatea con Prettier
npm run lint     # verifica con ESLint
```
