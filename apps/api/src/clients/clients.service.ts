import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateClientDto, UpdateClientDto } from "./dto";

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.client.findMany({ orderBy: { name: "asc" } });
  }

  async get(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException("Client not found");
    return client;
  }

  async create(dto: CreateClientDto) {
    const name = dto.name.trim();
    await this.assertUniqueName(name);

    return this.prisma.client.create({
      data: {
        name,
        status: dto.status ?? "ACTIVE"
      }
    });
  }

  async update(id: string, dto: UpdateClientDto) {
    const existing = await this.get(id);

    const nextName = dto.name?.trim();
    if (nextName && nextName.toLowerCase() !== existing.name.toLowerCase()) {
      await this.assertUniqueName(nextName);
    }

    return this.prisma.client.update({
      where: { id },
      data: {
        name: nextName,
        status: dto.status
      }
    });
  }

  private async assertUniqueName(name: string) {
    if (!name) throw new BadRequestException("Client name is required");
    const match = await this.prisma.client.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
      select: { id: true }
    });
    if (match) throw new ConflictException("Client name already exists");
  }
}
