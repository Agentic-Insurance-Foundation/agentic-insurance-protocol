import { join } from "node:path";
import type {
  GetDistributorResult,
  GetOperationParams,
  GetOperationResult,
  ListProductsParams,
  ListProductsResult,
  QuoteParams,
  QuoteResult,
  SubmitApplicationParams,
  SubmitApplicationResult,
} from "@spec/schema";
import type {
  GetCountryRulesParams,
  GetCountryRulesResult,
  SearchDistributorsParams,
  SearchDistributorsResult,
  VerifyLicenceParams,
  VerifyLicenceResult,
} from "@spec/registry";

export const EXAMPLES_DIR = join(import.meta.dir, "..", "spec", "examples");

/** Each example file, by name, with the schema type it must match. */
export interface Examples {
  "insurance-01-get_distributor.result": GetDistributorResult;
  "insurance-02-list_products.params": ListProductsParams;
  "insurance-03-list_products.result": ListProductsResult;
  "insurance-04-quote.params.first": QuoteParams;
  "insurance-05-quote.result.needs_input": QuoteResult;
  "insurance-06-quote.params.complete": QuoteParams;
  "insurance-07-quote.result.offers": QuoteResult;
  "insurance-08-quote.result.no_offer": QuoteResult;
  "insurance-09-quote.result.outside_scope": QuoteResult;
  "insurance-10-submit_application.params": SubmitApplicationParams;
  "insurance-11-submit_application.result": SubmitApplicationResult;
  "insurance-12-get_operation.params": GetOperationParams;
  "insurance-13-get_operation.result.approved": GetOperationResult;
  "registry-01-get_country_rules.params": GetCountryRulesParams;
  "registry-02-get_country_rules.result": GetCountryRulesResult;
  "registry-03-search_distributors.params": SearchDistributorsParams;
  "registry-04-search_distributors.result": SearchDistributorsResult;
  "registry-05-verify_licence.params.licensed": VerifyLicenceParams;
  "registry-06-verify_licence.result.licensed": VerifyLicenceResult;
  "registry-07-verify_licence.params.no_licence": VerifyLicenceParams;
  "registry-08-verify_licence.result.no_licence": VerifyLicenceResult;
  "registry-09-verify_licence.params.lapsed": VerifyLicenceParams;
  "registry-10-verify_licence.result.lapsed": VerifyLicenceResult;
  "registry-11-verify_licence.params.provider": VerifyLicenceParams;
  "registry-12-verify_licence.result.provider": VerifyLicenceResult;
  "registry-13-get_country_rules.params.state_line": GetCountryRulesParams;
  "registry-14-get_country_rules.result.state_line": GetCountryRulesResult;
}

export type ExampleName = keyof Examples;

/** The `schema.json` definition that each example file must match. */
export const EXAMPLE_DEFINITIONS: { [K in ExampleName]: string } = {
  "insurance-01-get_distributor.result": "GetDistributorResult",
  "insurance-02-list_products.params": "ListProductsParams",
  "insurance-03-list_products.result": "ListProductsResult",
  "insurance-04-quote.params.first": "QuoteParams",
  "insurance-05-quote.result.needs_input": "QuoteResult",
  "insurance-06-quote.params.complete": "QuoteParams",
  "insurance-07-quote.result.offers": "QuoteResult",
  "insurance-08-quote.result.no_offer": "QuoteResult",
  "insurance-09-quote.result.outside_scope": "QuoteResult",
  "insurance-10-submit_application.params": "SubmitApplicationParams",
  "insurance-11-submit_application.result": "SubmitApplicationResult",
  "insurance-12-get_operation.params": "GetOperationParams",
  "insurance-13-get_operation.result.approved": "GetOperationResult",
  "registry-01-get_country_rules.params": "GetCountryRulesParams",
  "registry-02-get_country_rules.result": "GetCountryRulesResult",
  "registry-03-search_distributors.params": "SearchDistributorsParams",
  "registry-04-search_distributors.result": "SearchDistributorsResult",
  "registry-05-verify_licence.params.licensed": "VerifyLicenceParams",
  "registry-06-verify_licence.result.licensed": "VerifyLicenceResult",
  "registry-07-verify_licence.params.no_licence": "VerifyLicenceParams",
  "registry-08-verify_licence.result.no_licence": "VerifyLicenceResult",
  "registry-09-verify_licence.params.lapsed": "VerifyLicenceParams",
  "registry-10-verify_licence.result.lapsed": "VerifyLicenceResult",
  "registry-11-verify_licence.params.provider": "VerifyLicenceParams",
  "registry-12-verify_licence.result.provider": "VerifyLicenceResult",
  "registry-13-get_country_rules.params.state_line": "GetCountryRulesParams",
  "registry-14-get_country_rules.result.state_line": "GetCountryRulesResult",
};

export function examplePath(name: ExampleName): string {
  return join(EXAMPLES_DIR, `${name}.json`);
}

/** Reads an example file. The caller validates it against `schema.json` before it relies on the type. */
export async function readExample<K extends ExampleName>(name: K): Promise<Examples[K]> {
  return (await Bun.file(examplePath(name)).json()) as Examples[K];
}
