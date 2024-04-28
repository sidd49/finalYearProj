import 'dotenv/config'
import Dockerode from "dockerode";

class Client extends Dockerode {
    local: boolean = false
    constructor(options: Dockerode.DockerOptions) {
        super(options)
    }

}
type ContainerSample = {
    sampleAt: Date
    cpu: number
}
class Manager {
    clients: Array<Client> = []
    samples: Map<string, Array<ContainerSample>> = new Map()
}
const sample = async (manager: Manager) => {
    const client = manager.clients.find(c => c.local)
    if (client) {
        const items = await client.listContainers().then((containers) => {
            return Promise.all(
                containers
                    .map(async (c) => {
                        return client.getContainer(c.Id).stats({ stream: false, "one-shot": true }).then(d => ({
                            container_id: c.Id,
                            data: d,
                            sampleAt: new Date()
                        }))
                    })
            )
        })
        items.forEach(async (item) => {
            const containerId = item.container_id

            if (!manager.samples.has(containerId)) {
                manager.samples.set(containerId, [] as any)
            }
            const cpuPromise = await client.getContainer(containerId).stats({ stream: false, "one-shot": true });
            const cpu_stats = cpuPromise.precpu_stats.cpu_usage.total_usage - cpuPromise.cpu_stats.cpu_usage.total_usage;

            const cpu_sysPromise = await client.getContainer(containerId).stats({ stream: false, "one-shot": true });
            const cpu_sys_stats = cpu_sysPromise.precpu_stats.system_cpu_usage - cpu_sysPromise.cpu_stats.system_cpu_usage;

            const no_of_cpuPromise = await client.getContainer(containerId).stats({ stream: false, "one-shot": true });
            const no_of_cpu = no_of_cpuPromise.cpu_stats.cpu_usage.percpu_usage.length;

            manager.samples.get(containerId)?.push({
                sampleAt: new Date(),
                cpu: (cpu_stats * 100.0 * no_of_cpu / cpu_sys_stats),
            })
        })
    }
}

const processor = (manager: Manager) => {
    // go through all the samples containers and check if CPU usage is high
    // manager.samples.((e) => {
        
    // });
    // if we find the container crossing resource limit call migrate


}

const migrate = (manager: Manager, containerId: string) => {
    // go through all the clients in the manager and find the first remote client
    const localClient = manager.clients.find(c => c.local)
    const remoteClient = manager.clients.find(c => !c.local)
    if (localClient && remoteClient) {
        // collect info for given containerid from local client
        // using the above info create remote conta
        //remoteClient.run()
    }

}

const main = async () => {
    const manager = new Manager()
    const client = new Client({
        host: process.env.DOCKER_HOST || 'localhost',
        port: Number(process.env.DOCKER_PORT || '2375'),
        protocol: 'http'
    })
    client.local = true
    manager.clients.push(client)

    setInterval(() => sample(manager), 5000)
    setInterval(() => processor(manager), 9000)
    sample(manager)
}

main()