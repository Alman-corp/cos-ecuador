export interface Repository<T, TId = string> {
  findById(id: TId): Promise<T | null>
  exists(id: TId): Promise<boolean>
  count(): Promise<number>
}

export interface WriteRepository<T, TId = string> extends Repository<T, TId> {
  save(entity: T): Promise<T>
  delete(id: TId): Promise<void>
  deleteMany(ids: TId[]): Promise<number>
}
