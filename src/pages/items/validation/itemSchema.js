import * as yup from 'yup';

/**
 * Base item-level validation — the fields every industry has in common.
 * Industry-specific extensions come in through {@link itemSchemaFor}.
 */
export const itemBaseSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required('Item name is required')
    .max(200, 'Name must be under 200 characters'),
  categoryId: yup
    .mixed()
    .test('required', 'Category is required', (v) => v !== null && v !== undefined && v !== ''),
  brandName: yup.string().nullable().max(120, 'Brand name too long'),
  description: yup.string().nullable().max(1000, 'Description too long'),
  attribute1: yup.string().nullable().max(120),
  attribute2: yup.string().nullable().max(120),
});

/**
 * Base variant validation — required for any variant, in any industry.
 */
export const variantBaseSchema = yup.object({
  sku: yup.string().nullable().max(80, 'SKU too long'),
  hsn: yup.string().nullable().max(20, 'HSN code too long'),
  unit: yup.string().trim().required('Unit is required'),
  pricePerUnit: yup
    .number()
    .typeError('Price must be a number')
    .required('Price is required')
    .positive('Price must be greater than zero'),
  gstRate: yup
    .number()
    .typeError('GST rate must be a number')
    .min(0, 'GST rate cannot be negative')
    .max(28, 'GST rate cannot exceed 28%')
    .nullable(),
  mrp: yup
    .number()
    .typeError('MRP must be a number')
    .min(0, 'MRP cannot be negative')
    .nullable()
    .test('mrp-gte-price', 'MRP must be greater than or equal to price', function (value) {
      if (value === null || value === undefined || value === '') return true;
      const price = this.parent.pricePerUnit;
      if (price === null || price === undefined || price === '') return true;
      return Number(value) >= Number(price);
    }),
  lowStockThreshold: yup
    .number()
    .typeError('Threshold must be a number')
    .min(0)
    .nullable(),
});

const FIELD_YUP_BUILDERS = {
  text: (f) => {
    let s = yup.string().nullable().max(255);
    if (f.required) s = s.required(`${f.label} is required`);
    return s;
  },
  number: (f) => {
    let s = yup.number().typeError(`${f.label} must be a number`).nullable();
    if (f.min !== null && f.min !== undefined) s = s.min(f.min, `${f.label} must be ≥ ${f.min}`);
    if (f.max !== null && f.max !== undefined) s = s.max(f.max, `${f.label} must be ≤ ${f.max}`);
    if (f.required) s = s.required(`${f.label} is required`);
    return s;
  },
  select: (f) => {
    let s = yup.string().nullable();
    if (f.options && f.options.length) {
      s = s.oneOf([...f.options, '', null, undefined], `${f.label} is not a valid option`);
    }
    if (f.required) s = s.required(`${f.label} is required`);
    return s;
  },
  date: (f) => {
    let s = yup.string().nullable();
    if (f.required) s = s.required(`${f.label} is required`);
    return s;
  },
  boolean: (f) => yup.boolean().nullable(),
};

const buildIndustryShape = (fieldSpecs = []) => {
  const shape = {};
  fieldSpecs.forEach((f) => {
    const builder = FIELD_YUP_BUILDERS[f.type] || FIELD_YUP_BUILDERS.text;
    shape[f.key] = builder(f);
  });
  return shape;
};

/**
 * Item schema extended with industry-specific item-level fields.
 *
 * @param {{ item?: any[] }} industryConfig — the object returned by
 *   `GET /api/config/industries/{type}/fields`. Passing null/undefined
 *   yields the base schema.
 */
export const itemSchemaFor = (industryConfig) => {
  const items = (industryConfig && industryConfig.item) || [];
  if (!items.length) return itemBaseSchema;
  return itemBaseSchema.concat(yup.object(buildIndustryShape(items)));
};

/**
 * Variant schema extended with industry-specific variant-level fields.
 *
 * @param {{ variant?: any[] }} industryConfig — the object returned by
 *   the industry-config endpoint.
 */
export const variantSchemaFor = (industryConfig) => {
  const variants = (industryConfig && industryConfig.variant) || [];
  if (!variants.length) return variantBaseSchema;
  return variantBaseSchema.concat(yup.object(buildIndustryShape(variants)));
};

/**
 * Runs a Yup schema against a value and returns a shape the caller can
 * surface directly in the UI: `null` on success, `{ message, details }`
 * on failure — where `details` is a plain object keyed by field.
 */
export const validate = async (schema, value) => {
  try {
    await schema.validate(value, { abortEarly: false, stripUnknown: false });
    return null;
  } catch (err) {
    const details = {};
    if (err.inner && err.inner.length) {
      err.inner.forEach((e) => {
        if (e.path && !details[e.path]) details[e.path] = e.message;
      });
    }
    return {
      message: err.errors && err.errors.length ? err.errors[0] : 'Please fix the highlighted fields',
      details,
    };
  }
};
