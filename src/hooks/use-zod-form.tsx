import { zodResolver } from '@hookform/resolvers/zod';
import { type FieldValues, type UseFormProps, useForm } from 'react-hook-form';
import type { ZodType, ZodTypeDef } from 'zod';

interface ZodSchema<T extends FieldValues = FieldValues>
  extends ZodType<T, ZodTypeDef & { typeName: string }, T> {}

export function useZodForm<TSchema extends ZodSchema>(
  props: Omit<UseFormProps<TSchema['_input']>, 'resolver'> & {
    schema: TSchema;
  }
) {
  const form = useForm<TSchema['_input']>({
    ...props,
    resolver: zodResolver(props.schema, undefined),
  });

  return form;
}
