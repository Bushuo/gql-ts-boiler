import { Entity, Column, BaseEntity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User extends BaseEntity {
    // because ppl cant guess this
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('varchar', { length: 255 })
    email: string;

    @Column('text')
    password: string;

    @Column('boolean', { default: false })
    confirmed: boolean;
}
