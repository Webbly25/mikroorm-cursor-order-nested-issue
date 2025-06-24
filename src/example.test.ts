import { Entity, ManyToOne, MikroORM, PrimaryKey, Property, Ref } from '@mikro-orm/sqlite';

@Entity()
class AEntity {

  @PrimaryKey()
  id!: number;

  @Property()
  aName: string;

  constructor(aName: string) {
    this.aName = aName;
  }
}

@Entity()
class BEntity {
	@PrimaryKey()
	id!: number;

	@ManyToOne(() => AEntity)
	a: Ref<AEntity>;

	@Property()
	bName: string;
	
	constructor(a: Ref<AEntity>, bName: string) {
		this.a = a;
		this.bName = bName;
	}
}

@Entity()
class CEntity {
	@PrimaryKey()
	id!: number;

	@ManyToOne(() => BEntity)
	b: Ref<BEntity>;

	@Property()
	cName: string;

	constructor(b: Ref<BEntity>, cName: string) {
		this.b = b;
		this.cName = cName;
	}
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [AEntity, BEntity, CEntity],
    debug: ['query', 'query-params'],
    allowGlobalContext: true, // only for testing
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('basic CRUD example', async () => {
  const names = 'abcdefghijklmnopqrstuvwxyz'.split('');

  for (const name of names) {
	const a = orm.em.create(AEntity, { aName: name });
	orm.em.persist(a);
	const b = orm.em.create(BEntity, { a, bName: name });
	orm.em.persist(b);
	const c = orm.em.create(CEntity, { b, cName: name });
	orm.em.persist(c);
  }

  await orm.em.flush();

  	let hasNextPage = true;
	let after: string | null = '';
	while (hasNextPage) {
		const cursor = await orm.em.findByCursor(CEntity, {}, {
			populate: ['b.a'],
			// populate: ['b', 'b.a'],
			after: after as string,
			first: 5,
			orderBy: [
				{ cName: 'asc' },
				{ b: { bName: 'asc' } },
				{ b: { a: { aName: 'asc' } } },
			]
			// orderBy: {
			// 	cName: 'asc',
			// 	b: {
			// 		bName: 'asc',
			// 		a: {
			// 			aName: 'asc',
			// 		}
			// 	}
			// }
		});
		
		after = cursor.endCursor;
		if (after === null) hasNextPage = false;
	}
  
	expect(1).toBe(1);
});
