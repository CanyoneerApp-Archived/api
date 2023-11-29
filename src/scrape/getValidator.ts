import Ajv, {ErrorObject} from 'ajv';
import FS from 'fs';
import {memoize} from 'lodash';
import {schemas} from '../writeAllSchemas';

type SchemaName = keyof typeof schemas;

const validateInner = memoize((schema: SchemaName) => {
  const ajv = new Ajv({allowUnionTypes: true, allErrors: true});
  const version = schemas[schema];
  return ajv.compile(
    JSON.parse(FS.readFileSync(`./output/schemas/${version}/${schema}.json`, 'utf-8')),
  );
});

export const validate = (schema: SchemaName, value: unknown) => {
  const validator = validateInner(schema);
  validator(value);
  if (validator.errors) {
    throw new SchemaValidationError(value, validator.errors);
  }
};

class SchemaValidationError extends Error {
  constructor(value: unknown, errors: ErrorObject[]) {
    super(`Failed to validate ${JSON.stringify(value)}\n${JSON.stringify(errors, null, 2)}`);
  }
}
