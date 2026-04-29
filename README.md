# P4 - Clon de Twitter

Práctica 4: clon funcional de Twitter con Next.js consumiendo la API del backend.

- **Demo:** https://frontend-p4.vercel.app/
- **Api:** https://backend-p4-klvc.onrender.com
- **Documentación:** https://backend-p4-klvc.onrender.com/api/docs/

---

## Instalación y arranque

```bash
git clone https://github.com/laragonza/P4-Clon-de-Twitter.git
cd P4-Clon-de-Twitter
npm install
npm run dev
```

La app arranca en http://localhost:3000

También hay que crear un archivo `.env.local` en la raíz con esto:

```
NEXT_PUBLIC_API_URL=https://backend-p4-klvc.onrender.com
NEXT_PUBLIC_STUDENT_NAME=laragonza
```

---

## Páginas implementadas

- `/auth` → login y registro en la misma pantalla, con un botón para cambiar entre los dos formularios. Al hacer login o registro guarda el token en una cookie y redirige al inicio.
- `/` → página principal con los últimos posts. Se puede publicar un post nuevo, dar like, hacer retweet y navegar entre páginas con la paginación de la api.
- `/post/[id]` → detalle de un post con su contenido, autor, likes, retweets y comentarios. Hay un formulario para comentar.
- `/profile/[username]` → perfil de un usuario con su nombre, seguidores, seguidos y sus posts. Hay un botón para seguir o dejar de seguir. También funciona con `/profile/me` para ver tu propio perfil.

---

## Cabeceras obligatorias

Todas las peticiones a la api llevan dos cabeceras que se añaden automáticamente en `src/api/api.ts`:

- `x-nombre: laragonza` → obligatorio para la evaluación
- `Authorization: Bearer <token>` → se saca de la cookie, solo si el usuario está logueado

---

## Autenticación y redirección

En `middleware.ts` se comprueba si hay cookie `token` antes de entrar a cualquier página. Si no hay token, redirige automáticamente a `/auth`. Las rutas públicas que no necesitan token son `/auth`, `/_next` y similares.

---

## Problema con los datos de la API

La api devuelve los campos a veces en español (`contenido`, `autor`, `comentarios`) y a veces en inglés (`content`, `author`, `comments`). Para no tener que comprobarlo en cada sitio, en `src/api/api.ts` hay unos helpers que prueban los dos nombres y devuelven el que exista:

- `pickText(post)` → devuelve el texto del post
- `pickAuthor(post)` → devuelve el autor
- `pickComments(post)` → devuelve la lista de comentarios
- `pickUserIdentifier(user)` → devuelve el id o username del usuario

