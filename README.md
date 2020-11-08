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
