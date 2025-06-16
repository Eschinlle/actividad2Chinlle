# Despliegue FinTech Solutions en Kubernetes (EKS)

Este directorio contiene todos los manifiestos necesarios para desplegar la aplicación FinTech Solutions en un clúster de Kubernetes (AWS EKS).

## Estructura de Archivos

- `01-namespace.yaml` - Namespace para la aplicación
- `02-secrets-config.yaml` - Secrets y ConfigMaps
- `03-mysql-simple.yaml` - Deployment de MySQL (sin persistencia)
- `04-backend.yaml` - Deployment del backend API (2 réplicas)
- `05-frontend.yaml` - Deployment del frontend web (2 réplicas)
- `06-hpa.yaml` - Horizontal Pod Autoscaler
- `07-loadbalancer.yaml` - LoadBalancer para acceso público

## Despliegue

### Prerrequisitos
- Clúster EKS funcionando
- kubectl configurado
- Imágenes subidas a ECR

### Comandos de Despliegue
```bash
# Aplicar en orden
kubectl apply -f 01-namespace.yaml
kubectl apply -f 02-secrets-config.yaml
kubectl apply -f 03-mysql-simple.yaml
kubectl apply -f 04-backend.yaml
kubectl apply -f 05-frontend.yaml
kubectl apply -f 06-hpa.yaml
kubectl apply -f 07-loadbalancer.yaml
