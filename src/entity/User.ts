import {
    Entity,
    Column,
    BaseEntity,
    PrimaryGeneratedColumn,
    BeforeInsert
} from 'typeorm';
import * as bcrypt from 'bcryptjs';

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

    @Column('boolean', { default: false })
    forgotPasswordLocked: boolean;

    @BeforeInsert()
    async hashPasswordBeforeInsert() {
        this.password = await bcrypt.hash(this.password, 10);
    }
}
