# SkyFitnessPro

SPA для онлайн-тренировок дома: каталог курсов, профиль, просмотр тренировок и учёт прогресса по упражнениям.

## Стек

| Технология             | Назначение          |
| ---------------------- | ------------------- |
| **React 19**           | UI                  |
| **TypeScript**         | типизация           |
| **Vite 7**             | сборка и dev-сервер |
| **react-router-dom 7** | маршрутизация       |
| **CSS Modules**        | стили компонентов   |

Данные курсов и прогресса запрашиваются с **fitness API** (по умолчанию `wedev-api.sky.pro`, см. `.env.example`).

**«Мои курсы»** для авторизованного пользователя — только с бэкенда: `GET /api/fitness/users/me` (`selectedCourses`), добавление `POST …/users/me/courses` (тело JSON `{"courseId":"…"}` **без** заголовка `Content-Type: application/json` — иначе wedev-api отвечает 400), удаление `DELETE …/users/me/courses/{courseId}` (см. **`POSTMAN_REQUESTS.md`**). В `localStorage` этот список не кешируется.

---

## Требования

- **Node.js** LTS (рекомендуется 20.x или новее)
- **npm** (идёт вместе с Node)

Проверка:

```bash
node -v
npm -v
```

---

## Установка

Клонируй репозиторий и установи зависимости:

```bash
cd -SkyFitnessPro
npm install
```

---

## Переменные окружения

1. Скопируй пример в корне проекта:

   ```bash
   copy .env.example .env
   ```

   (в PowerShell можно так же `Copy-Item .env.example .env`)

2. При необходимости отредактируй `.env`:
   - **`VITE_API_URL`** — базовый URL fitness API (пусто = используется адрес из кода, см. комментарии в `.env.example`).
   - При своём бэкенде укажи полный путь, например `http://localhost:3000/api/fitness`.

Переменные с префиксом `VITE_` доступны в приложении через `import.meta.env`.

---

## Запуск в режиме разработки

```bash
npm run dev
```

Открой в браузере адрес из терминала (обычно **http://localhost:5173/**).

---

## Сборка для продакшена

```bash
npm run build
```

Результат — папка **`dist/`**. Просмотр локально:

```bash
npm run preview
```

---

## Линтинг

```bash
npm run lint
```

## Форматирование (Prettier)

Проект использует **Prettier**; конфликтующие правила ESLint отключены через **eslint-config-prettier**.

```bash
npm run format        # применить стиль ко всему проекту
npm run format:check  # проверка без записи (для CI)
```

---

## Маршруты приложения

| Путь                                   | Описание                                                   |
| -------------------------------------- | ---------------------------------------------------------- |
| `/`                                    | Главная: баннер, карточки курсов                           |
| `/profile`                             | Профиль (требуется вход): данные пользователя, «Мои курсы» |
| `/course/:courseId`                    | Страница курса                                             |
| `/course/:courseId/workout/:workoutId` | Страница тренировки (видео, прогресс по упражнениям)       |

---

## Структура `src/` (кратко)

```
src/
├── main.tsx              # вход
├── App.tsx               # роутер, шапка, модалка входа
├── context/              # авторизация, «мои курсы»
├── components/           # Header, Hero, CourseCards, Footer, модалки и т.д.
├── pages/                # Profile, Course, Workout
├── services/             # запросы к API (курсы, тренировки, прогресс)
├── types/                # типы данных API
└── utils/                # хранилище сессии, URL видео и др.
```

Статика (иконки, изображения) — в **`public/`**.

---

## Что не попадает в Git (`.gitignore`)

В репозиторий **не коммитятся**, среди прочего:

- `node_modules/`, `dist/`, `.env*`
- папка **`fitness/`** и перечисленные в `.gitignore` локальные документы (Postman, старые описания проекта и т.п.)

Актуальное описание для команды и запуск — этот **`README.md`**.

---

## Деплой (Netlify или Vercel)

Проект — **статический фронт** после `npm run build` (папка **`dist/`**). API остаётся на `wedev-api.sky.pro`, отдельный бэкенд поднимать не нужно.

В корне уже лежат:

- **`netlify.toml`** — команда сборки и редиректы для React Router (нет 404 при обновлении `/profile`).
- **`vercel.json`** — то же для Vercel.

### Вариант A: Netlify

1. Зарегистрируйся на [netlify.com](https://www.netlify.com/) (можно через GitHub).
2. Положи проект в **репозиторий на GitHub** (если ещё нет): создай репозиторий → `git init` → commit → push.
3. В Netlify: **Add new site → Import an existing project** → выбери GitHub и репозиторий.
4. Настройки подтянутся из **`netlify.toml`**:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Нажми **Deploy**. Через минуту появится ссылка вида `https://random-name.netlify.app`.
6. **Переменные окружения** (если используешь свой `VITE_API_URL`): Site settings → Environment variables → добавь `VITE_API_URL` → **Redeploy**.

### Вариант B: Vercel

1. Зарегистрируйся на [vercel.com](https://vercel.com/) (через GitHub удобнее).
2. **Add New Project** → импорт репозитория с GitHub.
3. Framework Preset: **Vite** (или оставь авто). Root — корень репо, Output — **`dist`** (обычно определяется сам).
4. **Deploy**. Ссылка: `https://твой-проект.vercel.app`.
5. При необходимости: Settings → Environment Variables → `VITE_API_URL` → redeploy.

### Локальная проверка перед деплоем

```bash
npm run build
npm run preview
```

Открой показанный URL и проверь главную, вход, `/profile` после обновления страницы.

### Dokploy / Coolify

Это **свой сервер** (VPS) и Docker — имеет смысл, когда уже есть хостинг и нужен полный контроль. Для учебного фронта быстрее **Netlify или Vercel**.

---

## Лицензия

Проект помечен как `private` в `package.json`; условия распространения задайте при необходимости сами.
