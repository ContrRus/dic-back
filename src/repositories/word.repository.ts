import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DataBaseMongoDataSource} from '../datasources';
import {Word, WordRelations} from '../models';

export class WordRepository extends DefaultCrudRepository<
  Word,
  typeof Word.prototype.id,
  WordRelations
> {
  constructor(
    @inject('datasources.dataBaseMongo') dataSource: DataBaseMongoDataSource,
  ) {
    super(Word, dataSource);
  }
  getWordsByUserId(id: string) {
    return this.find({where: {userId: id}}).then(res => {
      return res;
    });
  }
}
