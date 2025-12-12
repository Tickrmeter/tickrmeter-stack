export type Graph = {
  values: number[];
  type: number;
  mark: number;
};

export type mappingJsonData = {
  symbol: string;
  displayLabel: string;
  displaySource: string;
  time: string;
  diff: number;
  value: number;
};


export type humbl3MappingJsonData = {
  title: string;
  subTitle: string;
  displayLabel: string;
  displaySource: string;
  displayTimeFrame: string;
  diff: number;
  value: number;
  feature: string;
};

export type Mapping = {
  [key: string]: string | boolean | Graph;
};
