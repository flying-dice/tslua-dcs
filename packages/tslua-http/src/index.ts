import { getQueryParams } from "./query-params";

print(getQueryParams("http://localhost:8080?one=1").one);
