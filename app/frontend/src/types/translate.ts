export type SignSequenceItem = {
  token: string;
  sign_id: string;
  type: string;
};

export type TranslateResponse = {
  input_text: string;
  sentence_type:
    | 'statement'
    | 'wh_question'
    | 'yes_no_question'
    | 'negation'
    | 'conditional'
    | 'command';
  gloss_tokens: string[];
  non_manual: string[];
  confidence_note: string;
  sign_sequence: SignSequenceItem[];
};