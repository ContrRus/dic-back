import {Model, model, property} from '@loopback/repository';
import {Envelope} from './envelope.model';
@model()
export class NodeMailer extends Model {
  @property({
    type: 'array',
    itemType: 'string',
  })
  accepted?: string[];

  @property({
    type: 'array',
    itemType: 'string',
    required: true,
  })
  rejected: string[];

  @property({
    type: 'number',
  })
  envelopeTime?: number;

  @property({
    type: 'number',
  })
  messageTime?: number;

  @property({
    type: 'number',
  })
  messageSize?: number;

  @property({
    type: 'string',
  })
  response?: string;

  @property({
    type: 'string',
  })
  messageId?: string;

  @property(() => Envelope)
  envelope: Envelope;

  constructor(data?: Partial<NodeMailer>) {
    super(data);
  }
}

export interface NodeMailerRelations {
  // describe navigational properties here
}

export type NodeMailerWithRelations = NodeMailer & NodeMailerRelations;
