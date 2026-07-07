# Casos de prueba — Home con carruseles de noticias

**Módulo:** Frontend (tab Home) · **Precondición:** backend corriendo con `NEWSDATA_API_KEY` en su `.env` (para los casos felices).

| ID | Título | Pasos | Resultado esperado | Estado |
|---|---|---|---|---|
| TC-HOME-01 | Carga feliz | Abrir la app (tab Home es la inicial) | Carrusel "Food news" con imágenes + carrusel "Health & nutrition"; entrada animada | Pendiente |
| TC-HOME-02 | Auto-avance | No tocar nada 15 segundos | El carrusel principal pasa solo cada ~5 s y los puntitos indican la posición | Pendiente |
| TC-HOME-03 | Swipe manual | Deslizar el carrusel a mano | Snap a la card siguiente; los puntitos se sincronizan; el auto-avance no "pelea" | Pendiente |
| TC-HOME-04 | Abrir nota | Tocar una card | Se abre la nota en el navegador in-app | Pendiente |
| TC-HOME-05 | Sin API key | Backend sin `NEWSDATA_API_KEY` | Mensaje claro con hint de configurarla; sin crash (verificado por smoke test ✅) | Pendiente |
| TC-HOME-06 | Backend caído | Apagar el backend y abrir Home | Error amable; pull-to-refresh reintenta | Pendiente |
| TC-HOME-07 | Nota sin imagen | (depende del feed) | Card con fondo rosa y emoji de fallback, no imagen rota | Pendiente |
| TC-HOME-08 | Título larguísimo | (depende del feed) | El título se corta en 2-3 líneas sin romper la card | Pendiente |
| TC-HOME-09 | Pull to refresh | Tirar hacia abajo | Spinner rosa, recarga ambos carruseles | Pendiente |
| TC-HOME-10 | Un tópico caído | Solo food responde (o solo health) | El carrusel que anda se muestra; el otro simplemente no aparece | Pendiente |
| TC-HOME-11 | Caché del backend | Refrescar 5 veces seguidas | Respuesta instantánea (caché 1 h); el cupo de NewsData no se gasta (ver logs) | Pendiente |
