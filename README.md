# PIE26.com - Sistema de Gestión de Integración Escolar

Plataforma profesional diseñada para la gestión de informes y acompañamiento de estudiantes con Necesidades Educativas Especiales (NEE), específicamente optimizada para el contexto educativo chileno.

## 🚀 Funcionalidades Principales

- **Gestión de Estudiantes:** Base de datos centralizada con perfiles completos y diagnósticos.
- **Informes a la Familia:** Generación de reportes semestrales (1° y 2° semestre) con indicadores de desempeño y convivencia.
- **Plan PAEC (Individual):** Sistema avanzado de acompañamiento estratégico con perfiles sensoriales, matriz de crisis y gestión de apoyos.
- **Formulario Único PIE:** Digitalización de la síntesis de evaluación y apoyos recomendados.
- **Asistente IA Profesional:** Integración con Gemini AI para sugerencias técnicas y redacción pedagógica asistida.
- **Gestión de Documentos:** Repositorio local para certificados y documentos adjuntos por estudiante.
- **Interfaz Premium:** Diseño moderno, oscuro y colapsable para máxima productividad.

## 🛠️ Tecnologías

- **Framework:** Next.js 14+ (App Router)
- **Base de Datos:** SQLite (Local y veloz)
- **IA:** Google Generative AI (Gemini 1.5 Flash)
- **Estilos:** Vanilla CSS con variables de diseño premium.

## 📦 Instalación Local

1. Clonar el repositorio.
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Configurar variables de entorno (Crear archivo `.env.local`):
   ```env
   GOOGLE_GENERATIVE_AI_API_KEY=tu_clave_de_gemini_aqui
   ```
4. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## 📂 Estructura de Datos

- La base de datos local se genera automáticamente como `students.db` y `student_nee.db`.
- Los archivos subidos se almacenan en `public/uploads/`.

## 🔒 Seguridad y Privacidad

Esta aplicación está configurada para ignorar archivos sensibles (`.db`, `.env`, `uploads/`) en el control de versiones de GitHub para proteger la privacidad de los estudiantes.

---
© 2026 Liceo Campanario - Desarrollado para la excelencia pedagógica.
