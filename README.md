# Padres 3.0

App movil para padres del ecosistema Starbiz Academy. Permite gestionar la membresia familiar, supervisar el progreso educativo de los hijos y acceder a mini-apps educativas.

**Stack:** React Native + Expo SDK 54 + TypeScript + Supabase + RevenueCat

## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- [Expo Go](https://expo.dev/go) instalado en tu celular (Android o iOS)
- Tu computadora y celular deben estar en la **misma red Wi-Fi**

## Configuracion rapida

### 1. Clonar e instalar

```bash
git clone https://github.com/jhenryorellana-eng/padres-30.git
cd padres-30
npm install
```

### 2. Variables de entorno

Crea un archivo `.env` en la raiz del proyecto:

```env
EXPO_PUBLIC_API_URL=https://app.starbizacademy.com
EXPO_PUBLIC_SUPABASE_URL=https://vmfdqkasrcrmcszmctmp.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<pedir al equipo>
EXPO_PUBLIC_PROJECT_ID=4d9f3db5-f0e5-4caf-bc16-5e500c24894f
EXPO_PUBLIC_RC_APPLE_API_KEY=<pedir al equipo>
EXPO_PUBLIC_RC_GOOGLE_API_KEY=<pedir al equipo>
```

> Las API keys sensibles no se incluyen en el repo. Pedirlas al equipo de desarrollo.

### 3. Iniciar el servidor de desarrollo

```bash
npx expo start
```

Esto abre un menu en la terminal con un codigo QR.

### 4. Abrir en tu celular

- **Android:** Abre Expo Go y escanea el codigo QR de la terminal.
- **iOS:** Escanea el codigo QR con la camara del iPhone, se abrira en Expo Go.

> Si no conecta, presiona `s` en la terminal para cambiar a modo **tunnel** (usa internet en vez de red local).

## Estructura del proyecto

```
app/                    # Pantallas (Expo Router - file-based routing)
  (tabs)/               # Navegacion por pestanas (Inicio, Novedades, Cuenta)
  onboarding/           # Flujo de registro (4 pasos)
    register.tsx        # Paso 1: Datos del padre
    select-plan.tsx     # Paso 2: Seleccionar plan familiar
    paywall.tsx         # Paso 3: Pago via RevenueCat IAP
    register-children.tsx # Paso 4: Datos de los hijos
    success.tsx         # Codigos generados + compartir WhatsApp
  perfil/               # Pantallas de perfil
    membresia.tsx       # Estado de membresia + renovar
    eliminar-cuenta.tsx # Eliminacion de cuenta (Apple 5.1.1)
  login.tsx             # Inicio de sesion

src/
  components/ui/        # Componentes reutilizables (Button, Card, Input)
  hooks/                # Custom hooks (useAuth, useNotifications)
  lib/                  # Clientes externos (Supabase, RevenueCat)
  services/             # Capa de servicios API
  stores/               # Estado global (Zustand)
  types/                # Tipos TypeScript
  utils/                # Utilidades (validadores, formateadores)
```

## Comandos utiles

| Comando | Descripcion |
|---------|-------------|
| `npx expo start` | Servidor de desarrollo |
| `npx expo start --tunnel` | Dev server via tunnel (si el QR no conecta) |
| `npx expo start --clear` | Dev server limpiando cache |
| `npm run lint` | Ejecutar ESLint |
| `eas build --platform ios --profile production` | Build de produccion iOS |
| `eas build --platform android --profile production` | Build de produccion Android |

## Flujo de usuario

```
Registro → Seleccionar plan → Pago (IAP) → Registrar hijos → Codigos generados → App
                                                                     ↓
Login ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← Codigo de padre
```

## Notas para testers

- Las compras en desarrollo usan el **sandbox** de Google Play / Apple. No se cobra dinero real.
- Al crear una cuenta, se genera un **codigo de padre** (P-XXXXXXXX) y **codigos de hijo** (E-XXXXXXXX).
- El codigo de padre se usa para iniciar sesion. Aparece en la pantalla de exito y se envia por email.
- La pestaña "Novedades" muestra notificaciones push (requiere permisos de notificacion).

## Backend

La app se conecta a [Hub Central](https://app.starbizacademy.com) (Next.js + Supabase). Los pagos se procesan via RevenueCat que envia webhooks al backend para activar la membresia.
