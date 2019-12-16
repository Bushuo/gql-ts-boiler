import { ValidationError } from 'yup';

export const formatYupError = (err: ValidationError) => {
    return err.inner.map(e => ({
        path: e.path,
        message: e.message
    }));
};
