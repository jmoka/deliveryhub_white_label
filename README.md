# React

A modern React-based project utilizing the latest frontend technologies and tools for building responsive web applications.

## 🚀 Features.

- **React 18** - React version with improved rendering and concurrent features
- **Vite** - Lightning-fast build tool and development server
- **Redux Toolkit** - State management with simplified Redux setup
- **TailwindCSS** - Utility-first CSS framework with extensive customization
- **React Router v6** - Declarative routing for React applications
- **Data Visualization** - Integrated D3.js and Recharts for powerful data visualization
- **Form Management** - React Hook Form for efficient form handling
- **Animation** - Framer Motion for smooth UI animations
- **Testing** - Jest and React Testing Library setup

## 📋 Prerequisites

- Node.js (v18.x or higher)
- Docker Desktop (rodando) — necessário pro Supabase local
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`npx supabase`)

## 🛠️ Instalação local (DeliveryHub)

1. Clonar o repositório e inicializar o submódulo do backend:
   ```bash
   git clone <repo-url>
   git submodule update --init --recursive
   ```

2. Garantir que o Docker Desktop está aberto.

3. Configurar o `.env` do backend:
   ```bash
   cd server_delivery
   copy .env.example .env
   ```
   Preencher `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` com os valores impressos pelo `supabase start` (passo 5).

4. Instalar dependências (raiz e backend):
   ```bash
   npm install
   cd server_delivery && npm install && cd ..
   ```

5. Subir o Supabase local (banco + auth + storage + migrations):
   ```bash
   npx supabase start
   ```
   Numa instalação nova não precisa de `supabase db reset` — isso só serve pra zerar um banco local já sujo.

6. Rodar o seed de dados iniciais (dentro de `server_delivery`) — cria admin, dono de restaurante, cliente, restaurante teste, produtos, impressora e garçom:
   ```bash
   npm run seed:primeiro-boot
   ```

7. Subir o backend (dentro de `server_delivery`, porta 3002):
   ```bash
   npm run start:dev
   ```

8. Subir o frontend (raiz do projeto, porta 4028):
   ```bash
   npm run dev
   ```

9. Acessar:
   - App: http://localhost:4028
   - Supabase Studio (visualizar banco): http://127.0.0.1:54333 — desligado por padrão, ligar em `supabase/config.toml` (`[studio] enabled = true`) e reiniciar (`npx supabase start`, use `--ignore-health-check` se o start travar em "unhealthy" nos containers `studio`/`storage`/`realtime`/`pg_meta` — health check dessas imagens costuma dar falso-negativo no Windows).

### Credenciais de teste (criadas pelo seed)

| Papel | Login | Senha |
|---|---|---|
| Admin | admin@delivery.com | senha padrão — troca obrigatória no 1º login |
| Dono de restaurante | resto@delivery.com | 1234567 |
| Cliente | usuario@delivery.com | 123456 |
| Garçom | login `TESTE001` | 123456 |

O seed é idempotente — rodar `npm run seed:primeiro-boot` de novo com dados já existentes não faz nada.

## 📁 Project Structure

```
react_app/
├── public/             # Static assets
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── styles/         # Global styles and Tailwind configuration
│   ├── App.jsx         # Main application component
│   ├── Routes.jsx      # Application routes
│   └── index.jsx       # Application entry point
├── .env                # Environment variables
├── index.html          # HTML template
├── package.json        # Project dependencies and scripts
├── tailwind.config.js  # Tailwind CSS configuration
└── vite.config.js      # Vite configuration
```

## 🧩 Adding Routes

To add new routes to the application, update the `Routes.jsx` file:

```jsx
import { useRoutes } from "react-router-dom";
import HomePage from "pages/HomePage";
import AboutPage from "pages/AboutPage";

const ProjectRoutes = () => {
  let element = useRoutes([
    { path: "/", element: <HomePage /> },
    { path: "/about", element: <AboutPage /> },
    // Add more routes as needed
  ]);

  return element;
};
```

## 🎨 Styling

This project uses Tailwind CSS for styling. The configuration includes:

- Forms plugin for form styling
- Typography plugin for text styling
- Aspect ratio plugin for responsive elements
- Container queries for component-specific responsive design
- Fluid typography for responsive text
- Animation utilities

## 📱 Responsive Design

The app is built with responsive design using Tailwind CSS breakpoints.


## 📦 Deployment

Build the application for production:

```bash
npm run build
```

## 🙏 Acknowledgments

- Built with [Rocket.new](https://rocket.new)
- Powered by React and Vite
- Styled with Tailwind CSS

Built with ❤️ on Rocket.new
