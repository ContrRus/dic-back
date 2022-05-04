import {Entity, model, property} from '@loopback/repository';

@model({settings: {strict: false}})
export class Word extends Entity {
  @property({
    type: 'string',
    required: true,
  })
  word: string;

  @property({
    type: 'string',
    required: true,
  })
  translation: string;

  @property({
    type: 'string',
    required: true,
  })
  wordGender: string;

  @property({
    type: 'string',
    required: true,
  })
  urlSearchPhoto: string;

  @property({
    type: 'string',
    required: true,
  })
  userId: string;

  @property({
    type: 'string',
    id: true,
  })
  id: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<Word>) {
    super(data);
  }
}

export interface WordRelations {
  // describe navigational properties here
}

export type WordWithRelations = Word & WordRelations;
