docker build -t gilsway/multi-client:latest -t gilsway/multi-client:$SHA -f ./client/Dockerfile ./client
docker build -t gilsway/multi-server:latest -t gilsway/multi-server:$SHA -f ./server/Dockerfile ./server
docker build -t gilsway/multi-worker:latest -t gilsway/multi-worker:$SHA -f ./worker/Dockerfile ./worker

docker push gilsway/multi-client:latest
docker push gilsway/multi-server:latest
docker push gilsway/multi-worker:latest
docker push gilsway/multi-client:$SHA
docker push gilsway/multi-server:$SHA
docker push gilsway/multi-worker:$SHA

kubectl apply -f k8s

kubectl set image deployments/server-deployment server=gilsway/multi-server:$SHA
kubectl set image deployments/client-deployment client=gilsway/multi-client:$SHA
kubectl set image deployments/worker-deployment worker=gilsway/multi-worker:$SHA