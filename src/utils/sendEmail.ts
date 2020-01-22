import * as SparkPost from 'sparkpost';
import 'dotenv/config';

const client = new SparkPost(process.env.SPARKPOST_API_KEY);

export const sendEmail = async (recipient: string, url: string) => {
    const response = await client.transmissions.send({
        options: {
            sandbox: true
        },
        content: {
            from: 'testing@sparkpostbox.com',
            subject: 'Confirm Your Email Adress',
            html: `<html>
                <body>
                <p> Testing SparkPost - the world's most awesome email service </p>
                <a href="${url}">confirm your email</a>
                </body>
                </html>`
        },
        recipients: [{ address: recipient }]
    });
    console.log(response);
};
