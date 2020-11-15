# nuber-eats

- 1.0 Apollo Server Setup

  - app.module 은 main.ts 로 import 되는 유일한 모듈
  - app.module 에서 필요한 여러 모듈을 import 하여 조합한 뒤 main.ts 로 연결하여 application 을 구성하게 됨.

- 1.1 Our First Resolver

  - nest - graphql
    - nest 의 방식으로 graphql 을 연결하여 사용하게 되며, Apollo Server 를 기반으로 한다.
    - schema, resolver, mutation 등 필요.
    - code first
      - typescript 파일을 만들고, graphql 파일을 만드는 과정을 통합할 수 있음.
      - typescript 파일을 만들면 자동으로 schema 를 생성.

- 1.2 ObjectType

  - entities
    - entity 란 데이터 베이스 모델이라고 생각하면 된다.
    - 추후 entity 는 graphql schema, database 에 사용된다.
    - graphql schema 를 위해서는 ObjectType 을 선언하고 Field 를 지정하여 사용하며
    - database 를 위해서는 Entity 를 선언하고 Column 을 지정하여 사용한다.

- 1.3 Arguments & 1.4 InputTypes and ArgumentTypes & 1.5 Validating ArgsTypes

  - Args() 사용
    - arguments 를 하나 하나 작성하여 사용할 수도 있고, 객체 형태로 만들어서 사용할 수도 있다. 이때 dto 라는 구조를 만들어서 사용할 수 있다.
  - dto 사용
    - dto 는 Data Transfer Object 의 약자로서, 통신할 때 데이터의 구조를 정의한다고 생각 할 수 있다.
    - dto 는 통신하는 데이터의 구조를 잡아주기 때문에 이 때 validator 를 사용하여 검증할 수 있다.
  - class-valdators

    - dto 파일에 class-validator 를 사용하여 각 필드의 validate 를 체크한다.
    - class-validator 를 applicatio 에서 사용하기 위해 main.ts 에 pipe 설정을 추가한다.

    ```ts
    import { ValidationPipe } from '@nestjs/common';
    import { NestFactory } from '@nestjs/core';
    import { AppModule } from './app.module';

    async function bootstrap() {
      const app = await NestFactory.create(AppModule);
      app.useGlobalPipes(new ValidationPipe());
      await app.listen(3000);
    }
    bootstrap();
    ```

  ```ts
  import { Field, ArgsType } from '@nestjs/graphql';
  import { IsString, IsBoolean, Length } from 'class-validator';

  @ArgsType()
  export class CreateRestaurantDto {
    @Field(_ => String)
    @IsString()
    @Length(5, 10)
    name: string;

    @Field(_ => Boolean)
    @IsBoolean()
    isVegan: boolean;

    @Field(_ => String)
    @IsString()
    address: string;

    @Field(_ => String)
    @IsString()
    ownerName: string;
  }
  ```

  - dto 와 @Args() 를 사용하여 Mutation 구성

  ```ts
  @Mutation(_ => Boolean)
  createRestaurant(@Args() createRestaurantDto: CreateRestaurantDto): boolean {
    console.log('createRestaurantDto: ', createRestaurantDto);
    return true;
  }
  ```

- 2.0 TypeORM and PostgreSQL

  - orm: Object Relational Mapping (객체 관계 매핑)
  - 타입스크립트나 nest 에서 데이터베이스와 통신하기 위해서는 orm 을 사용할 필요가 있다.
  - 직접 sql 문을 작성해서 데이터베이스와 통신해도 되지만 orm 을 사용하는 것이 편리하다.
  - typeorm 을 사용하여 typescript 의 장점을 활용하며 작업할 수 있다.

- 2.1 MacOS Setup & 2.2 Windows Setup

  - postgresql 설정

- 2.3 TypeORM Setup

  - tpyeorm 및 pg 설치

  ```
  nom install --save @nestjs/typeorm typeorm pg
  ```

  - app.module 에 TypeOrmModule import 한 뒤에 TypeOrmModule.forRoot({}) 설정.

  ```ts
    import { Module } from '@nestjs/common';
    import { TypeOrmModule } from '@nestjs/typeorm';
    import { Restaurant } from './restaurants/entitites/restaurant.entity';
    <!-- 생략 -->

    @Module({
      imports: [
        <!-- 생략 -->
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.POSTGRES_HOST,
          port: Number(process.env.POSTGRES_PORT),
          username: process.env.POSTGRES_USERNAME,
          password: process.env.POSTGRES_PASSWORD,
          database: process.env.POSTGRES_DATABASE,
          synchronize: process.env.NODE_ENV !== 'prod',
          logging: true,
          entities: [Restaurant],
        }),
      <!-- 생략 -->
      ],
      controllers: [],
      providers: [],
    })
    export class AppModule {}

  ```

- 2.4 Introducing ConfigService & 2.5 Configuring ConfigService & 2.6 Validating ConfigService

  - 환경변수 (.env) 설정
  - 보통 .env 파일 설정하고 dotenv 를 사용하는데 nest 에서는 nest 에서 제공하는 Config 기능을 사용할 수 있다.
  - 추가로 cross-env 를 사용하여 실행 NODE_ENV 에 따라 다른 .env 파일을 읽어 실행할 수 있도록 설정.

    - .env.dev, .env.prod, .env.test 로 구성하여 설정
    - package.json 의 실행 명령에 cross-env 를 활용하여 필요한 .env 파일 연결
    - .env 파일은 .gitignore 에 추가

    ```
    "start": "cross-env NODE_ENV=prod nest start",
    "start:dev": "cross-env NODE_ENV=dev nest start --watch",
    ```

  - app.module.ts 에 ConfigModule 설정
  - Joi 를 활용한 Validating

  ```ts
  import { Module } from '@nestjs/common';
  import * as Joi from 'joi';
  import { ConfigModule } from '@nestjs/config';
  <!-- 생략 -->

  @Module({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: process.env.NODE_ENV === 'dev' ? '.env.dev' : '.env.test',
        ignoreEnvFile: process.env.NODE_ENV === 'prod',
        validationSchema: Joi.object({
          NODE_ENV: Joi.string()
            .valid('dev', 'prod')
            .required(),
          POSTGRES_HOST: Joi.string().required(),
          POSTGRES_PORT: Joi.string().required(),
          POSTGRES_USERNAME: Joi.string().required(),
          POSTGRES_PASSWORD: Joi.string().required(),
          POSTGRES_DATABASE: Joi.string().required(),
        }),
      }),
      <!-- 생략 -->
    ],
    controllers: [],
    providers: [],
  })
  export class AppModule {}

  ```

- 3.0 Our First Entity

  - Entity

    - Entity 는 기본적으로 Model, 데이터 구조체라고 생각하면 될 듯 하다.
    - graphql schema 에서 사용하게 되는 구조와 database 에서 사용하게 되는 구조는 매우 비슷하다.
    - 그러므로 하나의 구조체를 사용하되, 각각의 용도에 맞는 데코레이터를 설정해주어 하나의 파일로 양쪽 모두에서 사용할 수 있다.

    ```ts
    import { Field, ObjectType } from '@nestjs/graphql';
    import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

    /**
     * entity for graphql and typeorm both.
     * so, it used in schema and database.
     */
    @ObjectType() // for graphql
    @Entity() // for typeorm
    export class Restaurant {
      @Field(_ => Number)
      @PrimaryGeneratedColumn()
      id: number;

      @Field(_ => String) // for graphql
      @Column() // for typeorm
      name: string;

      @Field(_ => Boolean)
      @Column()
      isVegan?: boolean;

      @Field(_ => String)
      @Column()
      address: string;

      @Field(_ => String)
      @Column()
      ownerName: string;

      @Field(_ => String)
      @Column()
      categoryName: string;
    }
    ```

- 3.1 Data Mapper vs Active Record

  - database 와 interact 할 패턴
  - typeorm 에서 두 패턴을 모두 지원. 선택해서 사용하면 됨.
  - ruby on rails, django 등에서는 Active Record 패턴을 사용하는 듯.
  - 지금 프로젝트에서는 Data Mapper 패턴을 사용.
  - 이유:

    - in typeorm page

      ```
      The decision is up to you. Both strategies have their own cons and pros.

      One thing we should always keep in mind in with software development is how we are going to maintain our applications. The Data Mapper approach helps with maintainability, which is more effective in bigger apps. The Active record approach helps keep things simple which works well in smaller apps. And simplicity is always a key to better maintainability.
      ```

    - 추가로 repository 를 사용함으로써 필요한 곳에 inject 하여 사용할 수 있다. nest 에서 repository, inject 등을 잘 지원하기 때문에 Data Mapper 를 더 잘 활용할 수 있는 듯 하다.

- 3.2 Injecting The Repository

  - module 에서 repository 를 import 하여 사용.

  ```ts
  import { Module } from '@nestjs/common';
  import { TypeOrmModule } from '@nestjs/typeorm';
  import { Restaurant } from './entitites/restaurant.entity';
  import { RestaurantResolver } from './restaurants.resolver';

  @Module({
    imports: [TypeOrmModule.forFeature([Restaurant])],
    providers: [RestaurantResolver],
  })
  export class RestaurantsModule {}
  ```

  - service 생성

    - controller, repository 등을 연결하며 작업을 정의하는 역할을 한다.
    - providers 로 정의되는데, 모든 providers 가 service 는 아니다.
    - @Injectable() 로 감싸며, 싱글톤으로 사용한다.
      즉, 같은 인스턴스가 애플리케이션 전체에 쓰이는 것.
    - business logic 이 메인
    - Controller 에서 constructor 에 Service 를 받아서(injected) 연결해 사용

    - restaurants.service.ts

    ```ts
    import { Injectable } from '@nestjs/common';

    @Injectable()
    export class RestaurantService {}
    ```

    - restaurants.module.ts

    ```ts
    import { Module } from '@nestjs/common';
    import { TypeOrmModule } from '@nestjs/typeorm';
    import { Restaurant } from './entitites/restaurant.entity';
    import { RestaurantResolver } from './restaurants.resolver';
    import { RestaurantService } from './restaurants.service';

    @Module({
      imports: [TypeOrmModule.forFeature([Restaurant])],
      providers: [RestaurantResolver, RestaurantService],
    })
    export class RestaurantsModule {}
    ```

    - resolver 에 constructor 로 설정

    ```ts
    import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
    import { CreateRestaurantDto } from './dtos/create-restaurant.dto';
    import { Restaurant } from './entitites/restaurant.entity';
    import { RestaurantService } from './restaurants.service';

    @Resolver(_ => Restaurant)
    export class RestaurantResolver {
      constructor(private readonly restaurantService: RestaurantService) {}
      <!-- 생략 -->
    }
    ```

    - 사용 process

      - module 에서 imports: repository, providers: service 설정
      - service 에서 repository 를 constructor 에서 inject 하여 repository 를 사용해 로직 작성
      - resolver 에서 service 를 constructor 에 가져와서 service 에 정의 된 로직을 사용.

      - restaurants.module.ts

      ```ts
      import { Module } from '@nestjs/common';
      import { TypeOrmModule } from '@nestjs/typeorm';
      import { Restaurant } from './entitites/restaurant.entity';
      import { RestaurantResolver } from './restaurants.resolver';
      import { RestaurantService } from './restaurants.service';

      @Module({
        imports: [TypeOrmModule.forFeature([Restaurant])],
        providers: [RestaurantResolver, RestaurantService],
      })
      export class RestaurantsModule {}
      ```

      - restaurants.service.ts

      ```ts
      import { Injectable } from '@nestjs/common';
      import { InjectRepository } from '@nestjs/typeorm';
      import { Repository } from 'typeorm';
      import { Restaurant } from './entitites/restaurant.entity';

      @Injectable()
      export class RestaurantService {
        constructor(
          @InjectRepository(Restaurant)
          private readonly restaurants: Repository<Restaurant>,
        ) {}
        getAll(): Promise<Restaurant[]> {
          return this.restaurants.find();
        }
      }
      ```

      - restaurants.resolver.ts

      ```ts
      import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
      import { CreateRestaurantDto } from './dtos/create-restaurant.dto';
      import { Restaurant } from './entitites/restaurant.entity';
      import { RestaurantService } from './restaurants.service';

      @Resolver(_ => Restaurant)
      export class RestaurantResolver {
        constructor(private readonly restaurantService: RestaurantService) {}
        @Query(_ => [Restaurant])
        restaurants(): Promise<Restaurant[]> {
          return this.restaurantService.getAll();
        }

        @Mutation(_ => Boolean)
        createRestaurant(
          @Args() createRestaurantDto: CreateRestaurantDto,
        ): boolean {
          console.log('createRestaurantDto: ', createRestaurantDto);
          return true;
        }
      }
      ```

      - repository 만들고, repository 를 써서 service 에서 로직 작성하고, service 의 로직을 resolver 에서 사용하며, 해당 repository, service, resolver 를 사용할 module 에서 통합하여 구성한다.

- 3.3 Recap

  - check again!

- 3.4 Create Restaurant

  - typeorm 의 create, save
  - create 는 typescript 쪽의 작업. database 를 건드리지 않고, class 를 말그대로 '생성'한다.
  - save 는 '생성'된 데이터를 database 에 저장한다.
  - create 할 때는 각 property 를 각각 설정해주거나, create 할 때 필요한 property 와 dto 의 구조가 같다면 dto 를 그대로 create 에 넣어줘도 된다.
  - create 하고 나면 this.restaurantsRepository.save(newRestaurant) 와 같이 생성 된 데이터를 save 에 넣어 database 에 저장한다.
  - 이 때 save 를 return 하게 되는데 return type 은 Promise 이다.

  - restaurants.service.ts

  ```ts
    createRestaurant(createRestaurantDto: CreateRestaurantDto) {
    const newRestaurant = this.restaurantsRepository.create(
      createRestaurantDto,
    );
    return this.restaurantsRepository.save(newRestaurant);
  }
  ```

- 3.5 Mapped Types

  - entity 와 dto 는 사용하는 곳이 다르고 지정하는 타입이 다르지만 형태는 비슷.
  - 그렇기에 하나의 파일을 entity 와 dto 에서 쓸 수 있도록 할 수 있다.
  - 먼저 Mapped Types 를 사용하려면 code-first 를 따라야 하며, 타입은 InputType 이어야 한다.
  - 상속받는 parent 의 타입이 InputType 이 아닐경우 상속받으며 secode-argument 로 InputType 을 넣어주거나, parent 타입에 InputType 을 설정하고, 해당 InputType 의 isAbstract 를 true 로 하여 사용할 수 있다.
  - 상속받을 때 모든 값을 상속받을 필요는 없기 때문에 Partial, Pick, Omit, Intersection, Composition 등을 활용해 필요한 형태로 상속받을 수 있다.

- 3.6 Optional Types and Columns

  - nullable 한 값은 nullable 설정
  - default 를 설정하려면 default 설정
  - 해당 값은 graphql schema 와 database column 에 모두 지정 가능하다. (각 명칭은 조금씩 다를 수 있다.)

- 3.7 Update Restaurant part One

  - update restaurant 의 args 의 경우 create restaurant 와 비슷하지만 id 를 required 로 받아야 한다.
  - createRestaurant 의 dto 를 정의할 때 Restaurant 를 Partial 로 가져왔었는데 이런식으로 Restaurant 자체를 Partial 로 할 경우 id 역시 nullable 이 된다.
  - 그렇기 때문에 createRestaurantDto 를 extends 해서 UpdateRestaurantInputType 을 만들고 그 아래에서 UpdateRestaurantDto 를 만들어서 id 와 위에서 만든 UpdateRestaurantInputType 을 설정한다.
  - 해당 타입을 통해 updateRestaurant Mutation 에서 updateRestaurantDto 하나의 args 설정으로 해결 할 수 있다.

- 3.8 Update Restaurant part Two

  - dto 가 만들어졌으면 service 에 메서드 작성.
  - service 의 메서드를 resolver 에 연결.
  - update 메서드는 두가지 arguments 를 받는 데, 첫번째 인자를 사용해 update 할 대상을 찾고, 두번째 인자로 전달하는 객체의 정보를 업데이트.

- 4.0 User Module Introduction

  - nest g module users
  - app.module.ts 에 자동으로 추가 됨.
  - users 폴더에 entities 폴더 생성 -> user.entity.ts 파일 생성
  - id, createdAt, updatedAt 는 여러 곳에서 사용될 것이기 때문에 반복을 피해가 위해 나중에 작업. email, password, role(client | owner | delivery) 먼저 작업.
  - id, createdAt, updatedAt 은 common 모듈을 만들어서 구현. 전체 application 에서 공유하여 사용.
  - common 폴더 -> core.entity.ts 파일 생성 -> CoreEntity 를 만들어서 id, createdAt, updatedAt 작성
  - User 모듈에서 CoreEntity 를 extends 해서 사용.
  - entity
    - id - PrimaryGenerateColumn
    - createdAt - CreateDateColumn
    - udpatedAt - UpdateDateColumn
    - email - Column
    - password - Column
    - role - Column

- 4.2 User Resolver and Service

  - user.resolver.ts, user.service.ts 생성
  - service 는 repositoy 필요 -> users.module.ts 에 User(entity) import. -> service 의 constructor 에서 InjectRepository 하여 사용.
  - resolver 의 constructor 에서 UsersService 를 가져와서 사용.
  - users.module.ts 의 providers 에 UsersService, UsersResolver 등록.

- 4.3 Create Account Mutation part One

  - user.entity.ts
    - UserEntity 를 graphql object 로 만들기 위해 ObjectType 설정 추가.
    - InputType({ isAbstract: true }) 추가
  - user.entity.ts, core.entity.ts 에 Field 추가
  - reolver 에 Mutation 생성 - createAccount
  - Mutation 메서드의 input 으로 사용할 Input 을 만들기 위해 dto 파일 생성.
  - create-account.dto.ts
    - CreateAccountInput
      - PickType 사용
      - 첫번째 자리에 사용할 entity 를 입력하고 그 entity 중에서 사용할 요소를 두번째 자리에서 pcik 해서 사용.
    - CreateAccountOutput
      - 말그대로 output. error 와 ok 를 설정
  - createAccount 의 Mutation return 값을 CreateAccountOutput 으로 설정하고,
    사용하는 Args 의 타입을 CreateAccountInput 으로 설정하여 사용.

- 4.4 Create Account Mutation part Two

  - user role 을 enum 으로 변경

    - enum 을 만들고 registerEnumType(UserRole, { name: 'UserRole' }); 도 설정
    - Column 에도 enum 을 인식시켜줘야 함.

    ```ts
      @Column({ type: 'enum', enum: UserRole })
      @Field(_ => UserRole)
      role: UserRole;
    ```

    - users.service.ts
      - createAccount
      - async 함수
      - args 로 CreateAccountInput 사용
      - try/catch
      - 존재하는 유저인지 확인하고, 존재하지 않는다면 create 하고, save!

- 4.5 Create Account Mutation part Three

  - service 에서 error 를 직접 정의. (throw Error 와 같은 형태로 error 를 표시하는 것이 아닌 직접 에러에 대해 명시하고 return 함. -> Go 의 패턴 차용)
  - resolver 에서 해당 error 를 확인하고, return 값이 있다면 에러 처리, 없다면 성공으로 판단.

- 실패라면 return { ok: false, error }, 성공이라면 return { ok: true }

- 4.6 An Alternative Error

  - ok, error 다루는 방법
  - Promise<{ ok: boolean; error?: string }> 와 같은 형태로 return 의 형태를 통일.
  - 추후 data 를 return 할 경우 data property 를 추가해서 사용하면 될 듯.
  - 추후 이런 return 타입을 공통으로 쓸 수 있게 따로 빼 두어도 좋을 듯.

- 4.7 Hashing Passwords

  - typeorm 의 listener 를 사용. 제공하는 메서드 중 @BeforeInsert() 를 사용.
  - typeorm listener: Any of your entities can have methods with custom logic that listen to specific entity events. You must mark those methods with special decorators depending on what event you want to listen to.
  - bcrypt 사용

- 4.8 Log In part One
  - dto 의 mutation output 을 common 으로 분리.
  - LoginOutput 의 경우 추가로 token 에 대한 Field 생성.
  - login.dto.ts -> PickType 사용하여 User 에서 "email", "password" 필드를 가져와서 사용.
