import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

const config = {
  name: 'dataBaseMongo',
  connector: 'mongodb',
  url: 'mongodb+srv://person:12345@cluster0.cdf90.mongodb.net/DictionaryDB?retryWrites=true&w=majority',
  host: '',
  port: 0,
  user: 'person',
  password: '12345',
  database: '',
  useNewUrlParser: true
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class DataBaseMongoDataSource extends juggler.DataSource
  implements LifeCycleObserver {
  static dataSourceName = 'dataBaseMongo';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.dataBaseMongo', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
