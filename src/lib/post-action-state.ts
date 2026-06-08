export type PostActionFieldErrors = {
  title?: string;
  body?: string;
  location?: string;
  photos?: string;
  tags?: string;
  tripType?: string;
};

export type PostActionState = {
  error: string | null;
  fieldErrors: PostActionFieldErrors;
};

export const initialPostActionState: PostActionState = {
  error: null,
  fieldErrors: {},
};
