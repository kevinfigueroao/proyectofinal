import { safeParse } from "valibot";

function getAllMessages(error) {
  if (!error || !error.issues) return [];
  let messages = [];
  for (const issue of error.issues) {
    if (issue.issues) {
      messages = messages.concat(getAllMessages(issue));
    } else if (
      issue.message &&
      !issue.message.startsWith('Invalid key:')
    ) {
      messages.push(issue.message);
    }
  }
  return messages;
}

export function validarComponentePeticion(tipo, esquema, fuente = 'body') {
  return (req, res, next) => {
    const { success, output, issues } = safeParse(esquema, req[fuente], { abortEarly: true });
    if (!success) {
      const mensajes = getAllMessages({ issues });
      return res.status(400).json({
        error: mensajes.join('\n') || "Error de validación"
      });
    }
    req[fuente] = output;
    next();
  };
}
