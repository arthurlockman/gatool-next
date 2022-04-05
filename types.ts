export interface APIGatewayResponse {
  statusCode: number,
  body: string,
  headers?: any,
  isBase64Encoded: boolean
};

export interface ResponseWithHeaders {
  headers: any;
  body: any;
};
