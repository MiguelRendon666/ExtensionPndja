# Azure Menubar Extension

Una extensión para Chrome que te permite personalizar la barra de menús de Azure DevOps agregando un GIF animado, y gestionar clases CSS personalizadas para la inserción del GIF.

## Características principales

- **Inserta un GIF animado** en la barra de menús de Azure DevOps (o cualquier elemento que elijas mediante selectores CSS personalizados).
- **Solo permite subir archivos GIF** para mantener la animación y coherencia visual.
- **Carga y guarda el GIF** localmente usando el almacenamiento de Chrome.
- **Elimina el GIF** de la barra de menús con un solo clic.
- **Gestión de clases CSS**: puedes agregar, listar y eliminar selectores CSS para definir dónde se insertará el GIF en cada dominio.
- **Interfaz moderna** con pestañas: una para el GIF y otra para la configuración avanzada.
- **Persistencia**: la configuración y el GIF se guardan por dominio y se mantienen entre sesiones.

## ¿Cómo funciona?

1. **Carga de GIF**: En la pestaña "Imagen" puedes seleccionar y subir un archivo GIF desde tu computadora. Este GIF se almacena localmente y se insertará automáticamente en la barra de menús de Azure DevOps la próxima vez que visites la página.
2. **Borrar GIF**: Puedes eliminar el GIF en cualquier momento desde la misma pestaña.
3. **Configuración avanzada**: En la pestaña "Config" puedes gestionar los selectores CSS (clases) que definen dónde se insertará el GIF. Esto permite adaptar la extensión a diferentes estructuras de página o dominios.
4. **Soporte multi-dominio**: La extensión detecta el dominio actual y permite guardar diferentes selectores para cada uno.

## ¿Cómo usarla?

1. Instala la extensión en Chrome (modo desarrollador).
2. Haz clic en el icono de la extensión para abrir el popup.
3. En la pestaña "Imagen":
   - Selecciona un archivo GIF animado.
   - Haz clic en "Actualiza Imagen" para guardarlo.
   - Haz clic en "Borra Imagen" para eliminarlo.
4. En la pestaña "Config":
   - Agrega, edita o elimina selectores CSS para definir el lugar donde se insertará el GIF.
   - Los cambios se guardan automáticamente y se aplican al recargar la página de Azure DevOps.

## Permisos requeridos

- **storage**: Para guardar el GIF y configuraciones localmente.
- **tabs**: Para identificar el dominio actual y aplicar la configuración correspondiente.

## Estructura de archivos

- `manifest.json`: Configuración de la extensión.
- `popup.html`: Interfaz de usuario de la extensión.
- `popup.js`: Lógica de la interfaz y gestión de eventos.
- `content.js`: Script que se ejecuta en las páginas para insertar el GIF.
- `README.md`: Este archivo.

## Notas técnicas

- La extensión utiliza Content Security Policy segura, por lo que todo el JS está separado del HTML.
- El almacenamiento de GIFs y selectores es por dominio, permitiendo personalización avanzada.
- El diseño es responsivo y moderno, con soporte para scroll y accesibilidad básica.
- **Solo se aceptan archivos .gif** en el input de carga.

---

¡Disfruta personalizando Azure DevOps con tus GIFs favoritos!