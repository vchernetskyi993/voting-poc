# Build
FROM golang:1.18 AS build
WORKDIR /avalanche

COPY go.mod .
COPY go.sum .
RUN go mod download

COPY *.go .
RUN go build -o /fivenodenetwork

# Deploy
FROM avaplatform/avalanchego:v1.7.9

# RUN apt update
# RUN apt install -y nmap less

COPY --from=build /fivenodenetwork /fivenodenetwork

EXPOSE 9650

CMD [ "/fivenodenetwork" ]
