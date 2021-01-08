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
      - 첫번째 자리에 사용할 entity 를 입력하고 그 entity 중에서 사용할 요소를 두번째 자리에서 pick 해서 사용.
    - CreateAccountOutput
      - 말그대로 output. error 와 ok 를 설정
  - createAccount 의 Mutation return 값을 CreateAccountOutput 으로 설정하고,
    사용하는 Args 의 타입을 CreateAccountInput 으로 설정하여 사용.

- 4.4 Create Account Mutation part Two

  - user role 을 enum 으로 변경

    - enum 을 만들고 registerEnumType(UserRole, { name: 'UserRole' }); 도 설정
    - Column 에도 enum 을 인식시켜줘야 함.

    ```ts
    enum UserRole {
      Client,
      Owner,
      Delevery,
    }

    registerEnumType(UserRole, { name: 'UserRole' });
    ```

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

- 4.9 Log In part Two

  - service 에 login function 정의

    ```
      /**
       *
       * TODO:
       * 1. find the user with the email
       * 2. check if the password is correct
       * 3. make a JWT and give it to the user
       */
    ```

    - email, password 를 받고, ok, error?, token? 을 return.
    - email 과 findOne 을 통해 user 가 존재하는지 확인.
    - password

      - hash 는 한방향 string -> hasehd string
      - 반대로 풀지는 못함.
      - 그렇지만 같은 string 의 경우 같은 hashed string 이 됨.
      - 그러므로 비교를 위해 string 으로 들어온 password 를 hash 해서 hash 된 상태로 저장되어 있는 database 의 password 와 비교.
      - entity 에 checkPassword 메서드 생성.
      - string password 를 받아서 bcrypt 의 compare 를 사용해 비교하고 결과를 return.

      ```ts
        async checkPassword(plainPassword: string): Promise<boolean> {
          try {
            const ok = await bcrypt.compare(plainPassword, this.password);
            return ok;
          } catch (error) {
            console.error(error);
            throw new InternalServerErrorException();
          }
        }
      ```

      - service 에서 user 를 찾고, user entity 에 속해있는 (위에 정의한) checkPassword 를 사용하여 password 검증.

      ```ts
      const user = await this.usersRepository.findOne({ email });
      const passwordCorrect = await user.checkPassword(password);
      ```

      - 해당 결과에 따라 return 값 변경하여 return.

- 5.0 Introduction to Authentication

  - nestjs 에서 제공하는 jwt passport 를 사용해도 됨.
  - 해당 프로젝트에서는 직접 jwt 를 다룸.

- 5.1 Generating JWT

  - jsonwebtoken 사용
  - app.module.ts
    - ConfigModule 에 SECRET_KEY 설정
    - SECRET_KEY 는 randomkeygen 에서 Keys 가져와서 env 에 설정하여 사용.
  - users.service.ts
    - token return.
    - token 의 secret 을 설정할 때, process.env 로 읽어와도 되지만 ConfigModule 에 설정했기 때문에 suers.module.ts 에서 ConfigService 를 imports 해서 사용.
    - app.module.ts 에 설정한 ConfigModule 설정을 ConfigService 로 사용할 수 있는 것 인듯.
    - users.service.ts 에서 User 를 Inject 했기 때문에 ConfigService 도 constructor 안에서 config: ConfigService 와 같은 식으로 가져와서 사용.
      - private readonly config: ConfigService
      - this.config.get("SECRET_KEY")

- 5.2 JWT and Modules

  - token 은 비밀을 유지하지 않음. 로그인 후 생성 된 token 을 jwt.io 에 넣어보면 token 이 가지고 있는 정보를 그대로 보여줌.
  - 그렇기 때문에 token module 을 따로 생성.

  - nest module
    - Static Module / Dynamic Module
      - Static Module 은 설정이 포함되어있지 않음.
      - Dynamic Module 은 forRoot 등의 설정이 된 Module.
      - Dynamic Module 로 만들어서 설정을 할 수 있지만 Dynamic Module 은 결국 Static Module 이 됨.

- 5.3 JWT Module part One

  - jwt 를 보강하기 위해 module 을 만들고,
    해당 module 을 service 에서 JwtService 와 같이 쓰려는 듯.
  - jwt module 을 만들고, 설정 추가.
  - module 을 처음 생성하면 static module. 이걸 dynamic module 로 만들기 위해서 해당 module 에 작업을 해줘야 함. (static forRoot() 등을 해당 module 안에 만들어줘야 함.)
  - module 을 service 에서 그냥 service 로 가져올 수 있는 줄 알았는데 그게 아니고 service 를 생성해야 함. (nest g service jwt)
  - service 를 만들고 module 에서 exports, providers 해줘야 함.

  - module 이 여러곳에서 쓰인다면 사용하는 module 에서 계속 imports 하는 것이 아닌 global 에서 설정할 수 있음. isGlobal 설정.
    module 자체에 Global() 설정을 할 수 있음.
    Global() 설정이 되어 있다면 사용시에 imports 하지 않아도 됨.
    (예: app.module.ts 에 설정 되어 있는 ConfigModule. ConfigModule 을 사용할 때 사용하는 module 에서 imports 를 하지 않아도 됨.)

- 5.4 JWT Module part Two

  - module 을 Global 로 만들면 어디서든 imports 없이 사용 가능.
  - app.module.ts 에는 등록해줘야 함.

  - jwt 에 대한 interface 생성

    - 생성한 interface 는 jwt module 의 forRoot 가 받는 인자(여기서는 options)의 타입을 정의함.

  - JwtService 에 인자 등의 데이터 (여기서는 options) 를 전달하기 위해 providers 사용.

  ```ts
  import { DynamicModule, Global, Module } from '@nestjs/common';
  import { CONFIG_OPTIONS } from './jwt.constants';
  import { JwtModuleOptions } from './jwt.interfaces';
  import { JwtService } from './jwt.service';

  @Module({})
  @Global()
  export class JwtModule {
    static forRoot(options: JwtModuleOptions): DynamicModule {
      return {
        module: JwtModule,
        exports: [JwtService],
        providers: [
          {
            provide: CONFIG_OPTIONS,
            useValue: options,
          },
          JwtService,
        ],
      };
    }
  }
  ```

  - providers 로 전달하고 나면, service 의 constructor 에서 받아서 Inject 해주면 됨.

  ```ts
  constructor(@Inject(CONFIG_OPTIONS)
  private readonly options: JwtModuleOptions
  ) {
    console.log(options)
  }
  ```

- 5.5 JWT Module part Three

  - jwt.sign 부분을 jwt.setvice 로 옮겨서 users.service 에서 가져와서 사용하는 것으로 변경.
  - users.service 에서 jwtService.sign 을 쓸 때 object 구조로 사용해서 여러 곳에서 필요에 따라 사용하게 할 수도 있고, 특정 요소만 (예를들어 user.id) 전달해서 특정 조건에만 사용하게 만들 수도 있음. 니꼬는 user.id 만 전달하도록 했고, 나는 object 구조 유지.

- 5.6 Middlewares in NestJS

  - token 을 통해 User 정보 알아내고, return 하기
  - middleware 사용

    - client 에서 요청을 보내면, 요청을 받고, 요청 처리 후에 nest() 함수 호출
    - middleware 에서 token 을 가져간 다음, 그 token 을 가진 사용자를 찾을 것.

  - jwt.middleware.ts

    - NestMiddleware 를 implements 해서 사용.
    - implements
      - extends 와 다르다.
      - implements 는 interface. 즉 implements 를 쓰는 class 가 interface 처럼 행동해야 한다는 것.
    - NestMiddleware 를 implements 한 뒤에 express 에서 제공하는 Request, Response, NextFunction 사용.
    - Request 의 header 등을 읽고, Response 한 뒤에, NextFunction 호출

    - middleware 를 한 App 에만 설치해서 사용할 수도 있고, AppModule 에 설치해서 여러 곳에서 쓸 수도 있다.

      - AppModule 에 설치

        - AppModule 에 NestModule 을 implements 로 상속.
        - NestModule 에서 필요로 하는 configure 설정 및 arguments, apply function 작성
        - forRoutes 를 지정해 어떤 경로, routes, 어떤 method 에 이 middleware 를 사용할지를 지정할 수 있다.
        - exclude 를 사용하면 특정 routes 를 제외해줌.

        ```ts
        export class AppModule implements NestModule {
          configure(consumer: MiddlewareConsumer) {
            consumer.apply(JwtMiddleware).forRoutes({
              path: '/graphql',
              method: RequestMethod.ALL,
            });
          }
        }
        ```

        - Inject 등의 기능을 사용하지 않는다면 function 으로 만들어도 된다.

        ```ts
        import { NestMiddleware } from '@nestjs/common';
        import { NextFunction, Request, Response } from 'express';

        // export class JwtMiddleware implements NestMiddleware {
        //   use(req: Request, res: Response, next: NextFunction) {
        //     console.log(req.headers);
        //     next();
        //   }
        // }

        export function JwtMiddleware(
          req: Request,
          res: Response,
          next: NextFunction,
        ) {
          console.log(req.headers);
          next();
        }
        ```

        - main.ts 에 사용해서 전체 어플리케이션에서 사용할 수도 있다.

        ```ts
        import { ValidationPipe } from '@nestjs/common';
        import { NestFactory } from '@nestjs/core';
        import { AppModule } from './app.module';
        import { JwtMiddleware } from './jwt/jwt.middleware';

        async function bootstrap() {
          const app = await NestFactory.create(AppModule);
          app.useGlobalPipes(new ValidationPipe());
          app.use(JwtMiddleware);
          await app.listen(3000);
        }
        bootstrap();
        ```

        - 전체 어플리케이션에서 사용하고 싶다면 main.ts 의 bootstrap 안에서 사용.
        - routes 별로 관리해서 사용하고 싶다면 AppModule 에서 consumer 를 사용해 통제.

- 5.7 JWT Middleware

  - users repository 를 쓰기 위해 JwtMiddleware 는 class 로 다시 전환.
  - main.ts 에서 app.use() 를 통해 app.use(JwtMiddleware) 와 같이 사용하는 것도 middleware 가 function 으로 구현됐을 때만 가능. -> middleware 사용도 AppModule 로 다시 전환.
  - jwt 의 verify 사용

    - decode - verify
      - decode 는 payload 를 반환하지만 signature 를 verify 하지는 않는다.
      - verify 는 암호 해독된 token 을 준다.

  - jwt.middleware 에서 dependency injection 을 위해 Injectable 설정.

  - Service 를 Dependency Injection 해서 사용하려면 해당 Service 를 갖고있는 module 에서 exports 해줘야 함.

- 5.8 GraphQL Context

  - jwt.middleware.ts 에서 req["user"] 에 user 정보를 담았기 때문에 해당 req 정보를 사용하기위해 graphql context 사용

  ```ts
  GraphQLModule.forRoot({
    autoSchemaFile: true,
    context: ({ req }) => ({ user: req['user'] }),
  }),
  ```

  - resolver 에서 해당 context 사용

  ```ts
  @Query(_ => User)
  me(@Context() context) {
    return console.log('-----context:\n ', context.user);
  }
  ```

- 5.9 AuthGuard

  - authorization
    - AuthGuard
    - auth module 생성
      - auth 폴더 안에 auth.guard.ts 파일 생성
      - guard 는 함수. request 를 다음 단계로 진행할지 말지 결정한다.
      - middleware 같이 Injectable 사용해서 만든다.
      - guard class 를 만드는데 CanActivate 를 상속받는다.
      - CanActivate 는 true 를 return 하면 request 를 진행시키고 false 면 request 를 멈춘다.
      - AuthGuard 안에 canActivate 함수를 구현한다. 조건에 따라 boolean 값 return.
      - 그러면 return 되는 boolean 값에 따라 true 이면 request 진행, false 이면 request 를 멈추게 된다.

- 5.10 AuthUser Decorator

  - users.resolver.ts 안의 me 함수에서 context 로 user 정보를 가져오기 위해 decorator 생성
    - auth-user.decorator.ts
      - createParamDecorator 사용
      - createParamDecorator 은 CustomParamFactory 의 형태를 필요로 하는데 CustomParamFactory 는 첫번째 인자는 unknown 타입의 data, 그 뒤로 context 등이 위치할 수 있다. context 는 ExecutionContext 타입을 지정한다.
      - 그후 GqlExecutionContext 을 사용해 context 를 생성하고, 생성된 컨텍스트에서 user 정보를 가져와 리턴한다.
  - 만들어진 authUser decorator 를 me 함수에 params 로 넣어서 authUser 에서 리턴하는 user 를 다시 리턴한다.

- 5.11 Recap

  - authentication work proces

    - tl;dr

      - header 에 token 을 보냄
      - token 을 decrypt, verify 하는 middleware 를 거쳐
      - request object 에 user 를 추가
      - 그리고 request object 가 graphql context 안으로 들어가게 되고,
      - guard 가 graphql context 를 찾아 user 가 있는지 없는지에 따라 true, false 를 return.
      - guard 에 의해 request 가 통과되면 resolver 에 decorator 를 사용
      - decorator 는 graphql context 에서 찾은 user 와 같은 user 를 찾으려고 함.
      - 그 user 를 return.

    - part1
      - header 에 token 을 보냄
      - header 는 http thing.
      - to intercept http thing -> make middleware
      - middleware 는 header 를 가져다가 우리가 만든 jwtService.verify() 를 사용
      - 여기서 id 를 찾게되면 우리가 만든 userService 사용해 해당 id 를 가진 user 를 찾는다.
      - userService 는 typeorm 의 findOne 함수를 쓰는 findById function 을 갖고 있다.
      - 그리고 db 에서 user 를 찾으면 그 user 를 request object 에 붙여서 보낸다.
      - middleware 를 가장 먼저 만나기 때문에 middleware 가 원하는대로 request object 를 바꿀 수 있다.
      - 그러면 middleware 에 의해 바뀐 request object 를 모든 resolver 에서 쓸 수 있다.
      - 만약 token 이 없거나 에러가 있다면, 아니면 token 으로 user 를 찾을 수 없다면 request 에 어떤 것도 붙이지 않는다.(즉 middleware 가 request object 를 수정하지 않고 에러만 출력함.)

  - part2

    - app.module.ts 에서 context 를 보면, apollo server 의 context 나 graphql 의 context 는 모든 resolver 에 정보를 보낼 수 있는 property 이다.
    - context 의 호출 조건 (모든 request?) - 2:48
    - context 에서 function 을 만들면 그 function 이 request object 를 줄 것.
    - 먼저 JwtMiddleware 를 거치고, GraphQlModule 안의 graphql context 에 request user 를 보냄.
    - users.resolver.ts

      - guard

        - guard 는 CanActivate 를 상속받아 canActivate 를 구현하여 생성.
        - canActivate 함수는 true 나 false 를 return.
        - true 를 return 하면 request 진행, flase 를 return 하면 request 를 중지 시킴.
        - canActivate 에서 사용되는 context 는 nestjs 의 ExecutionContext.
        - ExecutionContext 를 가져다가 GqlExucutionContext 로 바꿈.

          ```ts
          @Injectable()
          export class AuthGuard implements CanActivate {
            canActivate(context: ExecutionContext) {
              const gqlContext = GqlExecutionContext.create(
                context,
              ).getContext();
              const user = gqlContext['user'];
              if (!user) {
                return false;
              }
              return true;
            }
          }
          ```

        - 그러면 여기서 gqlContext 는 app.module.ts 의 GraphqlModule 의 context 와 같다.

        ```ts
          GraphQLModule.forRoot({
            autoSchemaFile: true,
            context: ({ req }) => ({ user: req['user'] }),
          }),
        ```

      - 생성한 AuthGuard 를 resolver 에서 필요한 곳에 사용.

      - decorator
        - guard 를 만들때와 비슷하게 context 를 가져다가 graphql context 를 생성한다.
        - 그리고 graphql context 에서 user 를 가져오면 user 를 return.
        - users.resolver.ts 에서 params 자리에 decorator 를 사용하여 return 값 가져와서 사용.

- 5.12 userProfile Mutation

  - users.resolver.ts
    - user query 생성
    - me 에서 id 호출하기 위해 core.entity.ts 의 CoreEntity 에 ObjectType 추가

- 5.13 updateProfile part One

  - editProfile

    - users.resolver.ts
      - editProfile Mutation 생성
      - Input, Output 정의하는 dto 생성
      ```ts
      @UseGuards(AuthGuard)
        @Mutation(_ => EditProfileOutput)
        async editProfile(
          @AuthUser() authUser: User,
          @Args('input') editProfileInput: EditProfileInput,
        ): Promise<EditProfileOutput> {
          return;
        }
      ```

  - edit-profile.dto.ts

    - Output 은 CoreOutput 사용
    - Input 은 User 에서 PickType 으로 가져오고, 가져온 것을 PartialType 으로 묶어서 만든다.

  - users.service.ts

    - editProfile

      - 로그인을 한 뒤에야 해당 함수를 호출할 수 있기때문에 따로 database 와 통신해서 확인하는 작업은 생략 -> update() 를 사용할 수 있음

      ```ts
      async editProfile(userId: number, { email, password }: EditProfileInput) {
        this.usersRepository.update(userId, { email, password });
      }
      ```

      - update 에는 구분자가 될 id 등을 넣고 (여기서는 userId), update 할 partialEntity 를 넣는다.

- 5.14 updateProfile part Two

  - editProfile 에서 update 후에 비밀번호가 hashed 되지 않은 상태로 저장된 것.
    - user.entity.ts 에서 hashPassword 에 정의된 데코레이터가 BeforeInsert 만 있었기 때문. BeforeUpdate 데코레이터 추가.
    - 이것으로 해결 안됨! -> BeforeUpdate hook 을 부르지 못하는 문제. 아래에서 이어서 작업.

- 5.15 updateProfile part Three

  - 니꼬가 에러 설명을 좋아하는 이유
    - "나는 에러가 나타나면 설명하는 걸 좋아해. 그래야 고칠 수 있고 왜 이러는지 이해할 수 있으니까."
    - 에러가 난다면 이런 자세로 접근하는 것도 좋겠다. 정리하고, 설명해보고, 고치고!
  - BeforeUpdate 가 호출되지 않음.
    - 설명
      - users repository 에서 this.users.update() 를 사용 중
      - update 메서드는 빠르고 효율적으로 query 를 update 함. 하지만 entity 가 있는지 없는지는 확인하지 않는다. 이 말은 우리가 직접 entity 를 update 하고 있지 않다는 것. 그저 database 에 query 를 보낼 뿐이다. 그래서 user entity 에 있는 BeforeUpdate 를 부르지 못하는 것. BeforeUpdate 는 특정 entity 를 update 해야 부를 수 있는 것.
      - 이걸 해결하기 위해서 save 메서드 사용. save 는 database 에 있는 모든 entity 를 save 하고 만약 entity 가 database 에 존재하지 않으면 insert 한다. 그렇지 않다면 update 한다.
      - save 를 사용하기 위해서 먼저 user entity 를 가져온다.

- 5.16 Recap

- 6.0 Verification Entity

  - users / enitities / verification.entity.ts 생성

    - Verification

      - InputType, ObjectType, Entity 설장
      - One-to-one relations

        - A 는 오로지 하나의 B 만 포함하고, B 도 오로지 하나의 A 만 포함하는 것.
          - 예를들어 하나의 user 는 하나의 verification 을 갖고, 하나의 verification 은 하나의 user 를 갖는 것.

      - typeorm 의 OneToOne 을 사용하며, OneToOne 은 JoinColumn 을 필요로 함.

      - User 로 부터 Verification 에 접근하고 싶다면 이 경우에는 JoinColumn 이 User 쪽에 있어야만 한다. 만약 Verification 으로부터 User 에 접근하고 싶다면 JoinColumn 이 Verification 쪽에 작성되어야 하는 것.

      - user entity 에도 verified 필드를 추가!

        - user 의 email 이 verifiy 됐는지 안 됐는지를 저장하기 위해

      - Verification 을 다 구현했다면 TypeOrmModule 에 추가

- 6.1 Creating Verifications

  - 유저가 계정을 생성했을 때 (usersService 의 createAccount) verification 도 만들었으면 함. - users.service.ts 에서!
  - 그러기 위해서 새로운 repository 필요
  - users.module.ts 로 가서 verification 추가
  - users.service.ts verification inject!
  - verification 은 code, user 가 필요
  - user 는 service 에서 생성한 user 를 넣어주고, code 는 verification.entity.ts 에서 BeforeInsert 데코레이터를 달고 createCode 메서드를 만들어서 Insert 되기 전에 code 를 생성해서, this.code = uuidv4(); 와 같이 넣어주는 것으로 구현
  - 그러면 service 에서 verification 을 create 하고, save

  ```ts
  await this.verifications.save(
    this.verifications.create({
      user,
    }),
  );
  ```

- 6.2 Verifying User part One

  - verifying user means:

    - verification code 를 사용해서 그들의 verification 을 찾는다.
    - 찾아 낸 다음에는 그걸 지우고 그 다음에 user 에 대한 verify 를 한다.

  - users.resolver.ts

    - mutation 추가
      - verify-email.dto.ts 작성
      - mutation verifyEmail 작성

  - users.service.ts
    - async verifyEmail 메서드 작성
    - 여기서 verification 을 찾음 -> const verification = await verifications.findOne({code})
    - 그리고 verification 이 있으면 다음 동작을 하는데, 이때 user 정보가 필요하다. 그런데 TypeOrm 은 relations 에 대한 조회를 그냥 해주지 않는다. 비용이 많이 드는 작업이기 때문.
    - 그렇기 때문에 const verification = await verifications.findOne({code}, {relations: ["user"]}) 와 같은 식으로 명시적으로 요구해야 함.
    - 이렇게 조회한 user 즉 verification.user.verified 를 true 로 변경하고 저장. this.users.save(verification.user)

- 6.3 Verifying User part Two

  - verify 를 하면 password 의 hash 가 바뀌는 문제

    - verify 를 하면 password 의 hash 를 다시 hash 함. -> 로그인 시도 실패

      - users.service.ts 의 verifyEmail 안에서 save 를 한번 더 호출하고 있기 때문

        - user.entity.ts 에서 BeforeUpdate 시에 password 를 hash 하는데 save 는 Update 에 해당하는 메서드여서 다시 hash 가 발생함.
        - 해결방법

          - part one
            - verify 할 때 user 객체에서 password 를 select 하지 않는 것. user 객체에서 password 를 제외하고 진행
            - user.entity.ts 에서 password 의 Column 에 select 옵션을 설정할 수 있음
            ```ts
                @Column({ select: false })
            ```
            이렇게 되면 user 를 조회했을 때 password 는 제외한 채로 넘어옴.
          - part two
            - user.entity.ts 의 hashPassword 에서 Insert 또는 Update 동작에 password 가 존재할 때만 hash 를 진행
          - part three

            - users.service.ts 의 login 에서 user 를 가져올 때 password 를 select 하고 싶다고 전달해야 함

            ```ts
            const user = await this.usersRepository.findOne(
              { email },
              { select: ['password'] },
            );
            ```

            - 여기서 token 에서 사용할 userId 도 select 해줘야 함.
              그래서 고친 코드는 아래와 같다.

            ```ts
            const user = await this.usersRepository.findOne(
              { email },
              { select: ['id', 'password'] },
            );

            // token 코드
            const token = this.jwtService.sign({ id: user.id });
            ```

          - part four
            - users.service.ts 의 verifyEmail 에서 save 이후에 return true
            - users.service.ts, users.resolver.ts 의 verifyEmail 을 try/catch 로 감싸서 작성

    - hashed 된 계정 삭제
      - 계정을 삭제하려고 하면 verify 가 남아있어서 삭제 안됨
        - verification.entity.ts 의 user 에 user 가 삭제되었을 때의 동작을 정의
          - CASCADE
            - 여기서는 user 를 삭제하면 user 와 연결 된 verification 도 같이 삭제한다는 것
          ```ts
                @OneToOne(_ => User, { onDelete: "CASCADE" })
          ```

- 6.4

  - 니꼬가 코드를 짜는 방법
    - 처음에는 코드를 엉망으로 작성. 동작만 하게.
    - 코드를 다 작성하고, 잘 동작한다면 코드를 한번 깔끔하게 정리해보는 것
  - 코드 정리

    - resolver

      - mutation

        - try/catch 나 if/else 등의 로직은 기존에는 resolver 등에도 산재해 있었는데, service 에서만 존재하도록 정리.
        - 기본적으로 resolver 가 할 일은 몇개의 input 을 받고 service 를 return 하는 것. service 로 데이터를 전달하는 것.
        - 즉 resolver 에는 받는 데이터들, 다루는 데이터들의 내용들 그리고 그것을 service 로 전달하는 로직이 담기게 됨.
        - 이 과정에서 resolver 에 있는 mutation 함수들은 service 로 연결하는 로직을 return 하는데 이것이 가능한 이유는 브라우저가 함수가 끝나기까지 await 해주기 때문이다.
          코드로 보는게 이해가 쉬운데 예를들어 바로 return 하는 코드는 아래와 같다.

        ```ts
            @Mutation(_ => VerifyEmailOutput)
            verifyEmail(
              @Args('input') verifyEmailInput: VerifyEmailInput,
            ): Promise<VerifyEmailOutput> {
              return this.usersService.verifyEmail(verifyEmailInput.code);
            }
        ```

        그리고 이 코드는 아래와 코드와 같은 동작을 한다.

        ```ts
            @Mutation(_ => VerifyEmailOutput)
            async verifyEmail(
              @Args('input') verifyEmailInput: VerifyEmailInput,
            ): Promise<VerifyEmailOutput> {
              const { ok, error } = await this.usersService.verifyEmail(
                verifyEmailInput.code,
              );
              return { ok, error };
            }
        ```

        명시적으로 작성하려면 아래와 같이 작성하면 좋고, 위의 코드와 같이 작성하더라도 브라우저가 자동으로 await 을 해주기때문에 같은 동작을 수행한다.

        - resolver 는 문지기 같은 역할 (grapqhql 을 쓰기때문에 resolver 가 이 역할을 하는 듯. rest 의 경우 controller 가 이 역할을 하는 듯.)
          - input 을 받아다가 올바른 service 로 전달하는 일
        - service 는 이것들을 다루는 로직이 정의된 부분

- 6.5 Mailgun Setup

  - verification 지우기 작업 먼저

    ```ts
    // users.service.ts
    await this.verifications.delete(verification.id);
    ```

  - 메일 보내기
    - 이메일 모듈을 먼저 만들어서 그걸로 유저 인증
  - mailgun 셋업

- 6.6 Mail Module Setup

  - nestjs 커뮤니티에서 만든 mailer 를 사용해도 됨.
    - 그러면 HTML 을 포함한 템플릿을 사용할 수 있음
    - 메일을 예쁘게 보내려고 한다면 필요!
    - 현재 프로젝트에서는 텍스트만 보낼거기 때문에 사용하지 않을 것
  - mail module
    - nest generate module mail
      - mail.module.ts
        - forRoot 설정
        - Options (interface) 설정
        - app module 에 추가, Joi 로 schema 검사
        - app module 에 추가시에 필요한 요소는 env 에 설정 후 가져와서 등록

- 6.7 Mailgun API

  - JWT 서비스에서 많은 부분을 복붙
  - mail.service.ts 생성
  - mail.module.ts 의 providers 에 MailService 설정 하고, exports 에 MailService 설정
  - mail.service.ts

    - 메일 보내는 함수 작성
    - node.js 에는 프론트엔드의 fetch 와 같은 기능이 없기 때문에 패키지 사용 - npm i got
    - api 로 post 리퀘스트 보낼 것

      - Authorization 값으로 mailgun 에서 제공하는 값을 사용하는데, base64 로 변환해서 사용함.
        - mailgun 에서 제공하는 값은 'api:YOUR_API_KEY'
        - 방법
          - 터미널에 node (node 실행)
          - Buffer.from('api:YOUR_API_KEY').toString('base64')
          - 위와 같이 하면 base64 로 변환한 string 을 줌
          - 이게 기본 인증 방식의 룰. 헤더의 기본 형태
          - 코드에서 사용할 때는 아래와 같이 사용
          ```ts
            ${Buffer.from(`api:${this.options.apiKey}`).toString('base64')}
          ```
      - form
        - form 을 맞춰줘야 함
        - form-data 라이브러리 사용
        - mailgun 의 cURL 의 form 형식에 맞춰서 구성하면 됨.
      - this.sendEmail('testing', 'test', '보낼 메일 주소');
        - NestJS 가 시작할 때 마다 이 함수를 테스트한다는 것

      ```ts
          import { Injectable, Inject } from '@nestjs/common';
          import { CONFIG_OPTIONS } from '../common/common.constants';
          import { MailModuleOptions } from './mail.interfaces';
          import got from 'got';
          import * as FormData from 'form-data';

          @Injectable()
          export class MailService {
            constructor(@Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions,) {
              this.sendEmail('testing', 'test', 'loshy244110@gmail.com');
            }
          }

          private async sendEmail(subject: string, content: string, to: string) {
            const form = new FormData();
            form.append('from', `Excited User <mailgun@${this.options.domain}>`)
            form.append('to', to);
            form.append('subject', subject);
            form.append('text', content);
            const response = await got(`https://api.mailgun.net/v3/${this.options.domain}/messages`, {
              headers: {
                "Authorization": `Basic ${Buffer.from(`api:${this.options.apiKey}`).toString('base64')}`
              },
              method: "POST",
              body: form,
              },
            );
            console.log(response.body);
          }
      ```

- 6.8 Beautiful Emails

  - mailgun 의 template
    - https://app.mailgun.com/app/sending/domains/sandbox908893656db64abb8b9ab23113a520b8.mailgun.org/templates
    - template 세팅
    - mail.service.ts
      - text 대신에 template 사용
      ```ts
      form.append('template', template);
      ```
      - template 에 필요한 변수들은 아래와 같이 설정
      ```ts
      form.append('v:username', 'USERNAME_VARIABLE');
      form.append('v:code', 'CODE_VARIABLE');
      ```

- 6.9 Refactor

  - mail.service.ts

    - public 메서드 생성
      - sendVerificationEmail
      - 여기서 sendEmail 을 실행

  - users.service.ts
    - mail.module.ts
      - mail module 을 Global 로 설정
    - users.service.ts 에서 아래와 같이 가져와서 사용
    ```ts
      private readonly mailService: MailService,
    ```
    - create, edit 하는 시점에 메일 보내는 함수 실행
    ```ts
    const verification = await this.verifications.save(
      this.verifications.create({ user }),
    );
    this.mailService.sendVerificationEmail({
      email: user.email,
      code: verification.code,
    });
    ```

- 7.0 Setting Up Tests

  - npm run test:watch

    - src/users/users.service.spec.ts 생성
    - 파일의 이름은 상관없지만 'spec' 이라는 부분은 필수!
      - package.json 의 jest 부분을 보면 아래와 같이 명시되어 있음
        ```json
              "testRegex": ".spec.ts$",
        ```
    - users.service.spec.ts

      - describe
        - 여기서 테스트 진행
      - beforeAll
        - 테스트 진행 전에 테스트 모듈 세팅
      - it

        - 아래와 같이 작성

        ```ts
        it('test name', () => {
          expect(service).toBeDefined();
        });

        it.todo('createAccount');
        it.todo('login');
        it.todo('findById');
        it.todo('editProfile');
        it.todo('verifyEmail');
        ```

- 7.1 Mocking

  - jest 의 경로탐색 방식에 따른 에러
    - package.json 의 jest 에 다음을 추가
    ```json
      "moduleNameMapper": {
        "^src/(.*)$": "<rootDir>/$1"
      },
    ```
  - repository 가 없어서 발생하는 에러

    - Repository 를 Mocking 해서 사용
    - unit test 이기 때문에 테스트 모듈을 독립적으로 유지하기위해 그 외에 필요한 것들을 mocking 해서 사용
    - describe 바깥에 mockRepository 생성

    ```ts
    const mockUserRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    const mockVerificationRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const mockMailService = {
      // private 메서드는 테스트 제외!
      sendVerificationEmail: jest.fn(),
    };
    ```

    - beforeAll 안에 providers 에 설정

    ```ts
    beforeAll(async () => {
      const module = await Test.createTestingModule({
        providers: [
          UsersService,
          {
            provide: getRepositoryToken(User),
            useValue: mockUserRepository,
          },
          {
            provide: getRepositoryToken(Verification),
            useValue: mockVerificationRepository,
          },
          {
            provide: JwtService,
            useValue: mockJwtService,
          },
          {
            provide: MailService,
            useValue: mockMailService,
          },
        ],
      }).compile();
      service = module.get<UsersService>(UsersService);
    });
    ```

- 7.2 Mocking part Two

  - unit test 의 개념
  - 출력물에 대한 테스트가 아닌 각 구성요소, 각 줄에 대한 테스트
  - Repository 가져오기
    - 타입스크립트 Partial, Record 사용

- 7.3 Writing Our First Test

- 7.4 Recap
