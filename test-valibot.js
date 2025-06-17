import { object, string, nonEmpty, safeParse } from 'valibot';

const schema = object({
    nombre: string([nonEmpty("Campo requerido")])
});
console.log(safeParse(schema, { nombre: '' }));
