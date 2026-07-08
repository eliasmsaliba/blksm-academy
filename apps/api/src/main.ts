import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? "http://localhost:3000",
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.setGlobalPrefix("api");

  // Railway (and most PaaS hosts) assign a dynamic port via PORT; prefer that,
  // falling back to API_PORT/4000 for local dev where nothing sets PORT.
  const port = process.env.PORT
    ? Number(process.env.PORT)
    : process.env.API_PORT
      ? Number(process.env.API_PORT)
      : 4000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`BLKSM Academy API listening on port ${port}`);
}

bootstrap();
