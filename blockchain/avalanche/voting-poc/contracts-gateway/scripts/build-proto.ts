import shelljs from "shelljs";

const SRC_DIR = "src/proto";
const OUT_DIR = "src/gen";
const PROTOC_PATH = "node_modules/grpc-tools/bin/protoc";
const PROTO_PLUGIN_PATH = "node_modules/.bin/protoc-gen-ts_proto";
const PROTOC_OPTS = [
  `--plugin=${PROTO_PLUGIN_PATH}`,
  "--ts_proto_opt=outputServices=grpc-js,env=node,useOptionals=messages,exportCommonSymbols=false,esModuleInterop=true",
  `--ts_proto_out=${OUT_DIR}`,
  `--proto_path=${SRC_DIR}`,
];

shelljs.mkdir("-p", OUT_DIR);
shelljs.exec(`${PROTOC_PATH} ${PROTOC_OPTS.join(" ")} ${SRC_DIR}/*.proto`);
